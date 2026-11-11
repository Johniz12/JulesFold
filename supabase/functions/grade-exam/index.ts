import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * LearnHub Edge Function: grade-exam
 * Alternative server-side grading implementation providing secure isolated execution
 * outside browser context with secret database keys.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify requesting user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { examId, answers } = await req.json();
    if (!examId || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "Invalid payload: examId and answers required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to securely read correct answers and calculate score
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: exam, error: examError } = await adminClient
      .from("exams")
      .select("*")
      .eq("id", examId)
      .eq("is_enabled", true)
      .single();

    if (examError || !exam) {
      return new Response(JSON.stringify({ error: "Exam not found or disabled" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch secret questions and answer keys safely
    const { data: questions, error: qError } = await adminClient
      .from("questions")
      .select("id, correct_answer, points")
      .eq("exam_id", examId);

    if (qError || !questions) {
      return new Response(JSON.stringify({ error: "Failed to load examination questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q) => {
      totalPoints += q.points;
    });

    const evaluatedAnswers = answers.map((ans) => {
      const q = questions.find((item) => item.id === ans.question_id);
      const isCorrect = q && (ans.student_answer || "").trim().toLowerCase() === (q.correct_answer || "").trim().toLowerCase();
      const pointsAwarded = isCorrect ? q.points : 0;
      if (isCorrect) {
        earnedPoints += pointsAwarded;
        correctCount++;
      } else {
        incorrectCount++;
      }
      return {
        question_id: ans.question_id,
        student_answer: ans.student_answer,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      };
    });

    const scorePercentage = totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(2)) : 0;
    const passed = scorePercentage >= exam.passing_percentage;

    // Record attempt
    const { data: attempt, error: attemptError } = await adminClient
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: user.id,
        score_percentage: scorePercentage,
        points_earned: earnedPoints,
        total_points: totalPoints,
        passed,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      return new Response(JSON.stringify({ error: attemptError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record individual answers
    const answerRecords = evaluatedAnswers.map((ea) => ({
      attempt_id: attempt.id,
      question_id: ea.question_id,
      student_answer: ea.student_answer,
      is_correct: ea.is_correct,
      points_awarded: ea.points_awarded,
    }));

    await adminClient.from("exam_answers").insert(answerRecords);

    return new Response(
      JSON.stringify({
        attempt_id: attempt.id,
        score_percentage: scorePercentage,
        points_earned: earnedPoints,
        total_points: totalPoints,
        passed,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        passing_percentage: exam.passing_percentage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
