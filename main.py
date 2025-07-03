import tkinter as tk
from tkinter import ttk, simpledialog, messagebox
import calendar
from datetime import datetime
import json
import os

DATA_FILE = "calendar_data.json"

class DesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Desktop Dashboard")
        self.root.geometry("1000x700") # Increased size for summary

        self.emoji_data = self.load_emoji_data()

        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(expand=True, fill=tk.BOTH)

        # Left panel for Calendar
        left_panel = ttk.Frame(main_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))

        # Calendar frame
        calendar_frame = ttk.LabelFrame(left_panel, text="Calendar", padding="10")
        calendar_frame.pack(fill=tk.BOTH, expand=True)


        self.year = datetime.now().year
        self.month = datetime.now().month

        self.calendar_controls_frame = ttk.Frame(calendar_frame)
        self.calendar_controls_frame.pack(pady=5)

        self.prev_month_button = ttk.Button(self.calendar_controls_frame, text="<", command=self.prev_month)
        self.prev_month_button.pack(side=tk.LEFT, padx=5)

        self.month_year_label = ttk.Label(self.calendar_controls_frame, text="", style="Header.TLabel")
        self.month_year_label.pack(side=tk.LEFT, padx=5)

        self.next_month_button = ttk.Button(self.calendar_controls_frame, text=">", command=self.next_month, width=3)
        self.next_month_button.pack(side=tk.LEFT, padx=5)

        self.calendar_display_frame = ttk.Frame(calendar_frame)
        self.calendar_display_frame.pack(expand=True, fill=tk.BOTH)

        self.draw_calendar() # Draws calendar and initially updates summary

        # Right panel for Widgets and Summary
        right_panel = ttk.Frame(main_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))

        # Emoji Summary Frame
        emoji_summary_frame = ttk.LabelFrame(right_panel, text="Emoji Summary (All Time)", padding="10")
        emoji_summary_frame.pack(fill=tk.BOTH, expand=True, pady=(0,10))

        # Use a ttk.Frame for the Text widget to control its border/relief if needed with themes
        summary_text_frame = ttk.Frame(emoji_summary_frame, borderwidth=1, relief=tk.SUNKEN)
        summary_text_frame.pack(expand=True, fill=tk.BOTH, pady=5)

        self.summary_text = tk.Text(summary_text_frame, wrap=tk.WORD, height=10, width=30,
                                    font=("Arial", 10), relief=tk.FLAT, borderwidth=0) # Tkinter Text, not ttk
        self.summary_text.pack(expand=True, fill=tk.BOTH, padx=2, pady=2)
        self.summary_text.config(state=tk.DISABLED) # Make it read-only

        # Placeholder for other widgets
        # widgets_frame = ttk.LabelFrame(right_panel, text="Other Widgets", padding="10")
        # widgets_frame.pack(fill=tk.BOTH, expand=True)
        # self.widget_placeholder_label = ttk.Label(widgets_frame, text="Other widgets will be here")
        # self.widget_placeholder_label.pack()

        self.update_emoji_summary() # Initial summary update

    def draw_calendar(self):
        # Clear previous calendar
        for widget in self.calendar_display_frame.winfo_children():
            widget.destroy()

        self.month_year_label.config(text=f"{datetime(self.year, self.month, 1).strftime('%B %Y')}")

        cal = calendar.monthcalendar(self.year, self.month)
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        # Day headers
        for i, day_name in enumerate(days):
            lbl = ttk.Label(self.calendar_display_frame, text=day_name, style="DayHeader.TLabel")
            lbl.grid(row=0, column=i, padx=5, pady=5, sticky="nsew")

        # Calendar days
        today = datetime.now()
        for week_num, week in enumerate(cal):
            for day_num, day_val in enumerate(week): # Renamed 'day' to 'day_val' to avoid conflict
                if day_val != 0:
                    date_key = f"{self.year}-{self.month:02d}-{day_val:02d}"
                    emoji = self.emoji_data.get(date_key, "")
                    day_str = f"{day_val}\n{emoji}" if emoji else str(day_val)

                    # Use a lambda that captures the current day_val
                    btn = ttk.Button(self.calendar_display_frame, text=day_str, width=4,
                                     command=lambda d=day_val: self.on_date_click(d))
                    btn.grid(row=week_num + 1, column=day_num, padx=2, pady=2, sticky="nsew")

                    if self.year == today.year and self.month == today.month and day_val == today.day:
                        btn.configure(style="Today.TButton")
                else:
                    # Empty label for days not in the month
                    lbl = ttk.Label(self.calendar_display_frame, text="")
                    lbl.grid(row=week_num + 1, column=day_num, padx=2, pady=2, sticky="nsew")

        # Configure column/row weights for resizing
        for i in range(7): # 7 days
            self.calendar_display_frame.grid_columnconfigure(i, weight=1)
        for i in range(len(cal) + 1): # Number of weeks + header
             self.calendar_display_frame.grid_rowconfigure(i, weight=1)


    def prev_month(self):
        self.month -= 1
        if self.month == 0:
            self.month = 12
            self.year -= 1
        self.draw_calendar()

    def next_month(self):
        self.month += 1
        if self.month == 13:
            self.month = 1
            self.year += 1
        self.draw_calendar()

    def on_date_click(self, day):
        if day == 0: # Should not happen if logic is correct elsewhere
            return

        date_key = f"{self.year}-{self.month:02d}-{day:02d}"
        current_emoji = self.emoji_data.get(date_key, "")

        # Ask for new emoji
        # For simplicity, we ask for a single character.
        # A more complex app might use an emoji picker.
        new_emoji = simpledialog.askstring("Add Emoji", f"Enter emoji for {day}/{self.month}/{self.year}:",
                                           initialvalue=current_emoji)

        if new_emoji is not None: # User didn't cancel
            if new_emoji: # Not an empty string
                # Basic validation: allow one or two characters (for emojis like flags or skin tone modifiers)
                if 1 <= len(new_emoji) <= 2:
                    self.emoji_data[date_key] = new_emoji
                else:
                    messagebox.showwarning("Invalid Emoji", "Please enter a single emoji character (or a 2-char flag/modifier).")
            else: # Empty string means remove emoji
                if date_key in self.emoji_data:
                    del self.emoji_data[date_key]
            self.save_emoji_data()
            self.draw_calendar() # Redraw to show new/removed emoji
            self.update_emoji_summary() # Crucial: Update summary after data change

    def update_emoji_summary(self):
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)

        if not self.emoji_data:
            self.summary_text.insert(tk.END, "No emojis recorded yet.")
            self.summary_text.config(state=tk.DISABLED)
            return

        counts = {}
        # We want to count emojis regardless of the year/month for an "All Time" summary
        for date_key in self.emoji_data:
            emoji = self.emoji_data[date_key]
            counts[emoji] = counts.get(emoji, 0) + 1

        if not counts: # Handles cases where emoji_data might exist but is empty after deletions
            self.summary_text.insert(tk.END, "No emojis recorded yet.")
            self.summary_text.config(state=tk.DISABLED)
            return

        # Sort by count (descending), then by emoji (ascending) for consistent order
        sorted_summary = sorted(counts.items(), key=lambda item: (-item[1], item[0]))

        summary_str = ""
        for emoji, count in sorted_summary:
            summary_str += f"{emoji} : {count}\n" # e.g., "🎉 : 5"

        self.summary_text.insert(tk.END, summary_str)
        self.summary_text.config(state=tk.DISABLED)

    def load_emoji_data(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading data file: {e}. Starting with empty data.")
                return {}
        return {}

    def save_emoji_data(self):
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.emoji_data, f, ensure_ascii=False, indent=4)
        except IOError as e:
            print(f"Error saving data file: {e}")
            messagebox.showerror("Save Error", "Could not save emoji data.")


if __name__ == "__main__":
    root = tk.Tk()
    style = ttk.Style(root)

    # Attempt to set a more modern theme
    available_themes = style.theme_names()
    # print(f"Available themes: {available_themes}") # For debugging
    for t in ["clam", "alt", "default"]: # Try common modern themes
        if t in available_themes:
            style.theme_use(t)
            break

    # General font
    default_font = ("Arial", 10)
    bold_font = ("Arial", 10, "bold")
    header_font = ("Arial", 12, "bold")

    # Style configurations
    style.configure("TLabel", font=default_font, padding=2)
    style.configure("TButton", font=default_font, padding=5)
    style.configure("TLabelframe.Label", font=bold_font, padding=5)
    style.configure("Header.TLabel", font=header_font) # For month/year

    # Style for today's date button
    style.configure("Today.TButton", font=bold_font, foreground="white", background="#0078D7") # Example: Blue background

    # Calendar day buttons - ensure they can accommodate multi-line text (emoji + day number)
    style.map("TButton",
              padding=[("!disabled", (5, 8))], # Adjusted padding
              justify=[("!disabled", tk.CENTER)],
              relief=[('pressed', 'sunken'), ('!pressed', 'raised')])

    # Specific style for calendar day headers (Mon, Tue, etc.)
    style.configure("DayHeader.TLabel", font=bold_font, anchor=tk.CENTER, padding=(2,5))


    app = DesktopApp(root)
    root.mainloop()
