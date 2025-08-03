// Core logic for the web project runner will go here.
console.log("Web Project Runner script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    const loadProjectBtn = document.getElementById('load-project-btn');
    const statusMessages = document.getElementById('status-messages');

    let activeBlobUrls = [];

    loadProjectBtn.addEventListener('click', async () => {
        // Revoke previous blob URLs to prevent memory leaks
        activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
        activeBlobUrls = [];

        try {
            const dirHandle = await window.showDirectoryPicker();
            updateStatus(`Loading project: ${dirHandle.name}...`);
            await analyzeAndRenderProject(dirHandle);
        } catch (err) {
            if (err.name === 'AbortError') {
                updateStatus('Directory selection cancelled.');
            } else {
                updateStatus(`Error: ${err.message}`, true);
                console.error(err);
            }
        }
    });

    function updateStatus(message, isError = false) {
        statusMessages.textContent = message;
        statusMessages.style.color = isError ? 'red' : 'black';
    }

    async function analyzeAndRenderProject(dirHandle) {
        const dependenciesDiv = document.getElementById('dependencies');
        const iframe = document.getElementById('project-iframe');

        // Clear previous state
        dependenciesDiv.innerHTML = '';
        iframe.src = 'about:blank';

        // 1. Analyze Project
        updateStatus(`Analyzing project...`);
        let indexHtmlHandle;
        try {
            indexHtmlHandle = await dirHandle.getFileHandle('index.html');
        } catch (e) {
            updateStatus('Error: index.html not found in the project root.', true);
            return;
        }

        let dependencies = {};
        try {
            const packageJsonHandle = await dirHandle.getFileHandle('package.json');
            const packageJsonFile = await packageJsonHandle.getFile();
            const packageJsonText = await packageJsonFile.text();
            const packageJson = JSON.parse(packageJsonText);
            dependencies = packageJson.dependencies || {};

            const devDeps = packageJson.devDependencies || {};

            let depsHtml = '<h3>Dependencies:</h3>';
            if (Object.keys(dependencies).length === 0 && Object.keys(devDeps).length === 0) {
                 depsHtml += '<p>No dependencies found.</p>';
            } else {
                if (Object.keys(dependencies).length > 0) {
                    depsHtml += '<ul>';
                    for (const [name, version] of Object.entries(dependencies)) {
                        depsHtml += `<li>${name}: ${version}</li>`;
                    }
                    depsHtml += '</ul>';
                }
                if (Object.keys(devDeps).length > 0) {
                    depsHtml += '<h3>Dev Dependencies:</h3>';
                    depsHtml += '<ul>';
                    for (const [name, version] of Object.entries(devDeps)) {
                        depsHtml += `<li>${name}: ${version}</li>`;
                    }
                    depsHtml += '</ul>';
                }
            }
            dependenciesDiv.innerHTML = depsHtml;

        } catch (e) {
            dependenciesDiv.innerHTML = '<h3>Dependencies:</h3><p>No package.json found or it could not be read.</p>';
        }

        // 2. Render Project
        await renderProject(dirHandle, indexHtmlHandle, dependencies);
    }

    async function renderProject(dirHandle, indexHtmlHandle, dependencies) {
        const iframe = document.getElementById('project-iframe');
        updateStatus('Rendering project...');
        try {
            const indexHtmlFile = await indexHtmlHandle.getFile();
            let indexHtmlText = await indexHtmlFile.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(indexHtmlText, 'text/html');

            // Fetch and inject CDN dependencies
            if (Object.keys(dependencies).length > 0) {
                updateStatus('Fetching dependencies from CDN...');
                const cdnUrls = [];
                const depPromises = Object.entries(dependencies).map(async ([name, version]) => {
                    try {
                        const response = await fetch(`https://data.jsdelivr.com/v1/package/npm/${name}@${version}/entrypoints`);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch metadata for ${name}@${version}`);
                        }
                        const data = await response.json();
                        if (data.js) {
                            const cdnUrl = `https://cdn.jsdelivr.net/npm/${name}@${version}${data.js.file}`;
                            cdnUrls.push(cdnUrl);
                        }
                    } catch (e) {
                        console.warn(`Failed to resolve dependency: ${name}@${version}`, e);
                    }
                });
                await Promise.all(depPromises);

                // Inject script tags for CDN URLs
                cdnUrls.forEach(url => {
                    const script = doc.createElement('script');
                    script.src = url;
                    script.defer = true;
                    doc.head.prepend(script);
                });
            }

            // Process local assets
            updateStatus('Resolving local assets...');
            const assetPromises = [];
            const elements = doc.querySelectorAll('[href], [src]');
            elements.forEach(el => {
                const attribute = el.hasAttribute('href') ? 'href' : 'src';
                const path = el.getAttribute(attribute);

                if (path && !path.startsWith('http') && !path.startsWith('//') && !path.startsWith('data:')) {
                    assetPromises.push(async () => {
                        try {
                            const assetHandle = await resolvePath(dirHandle, path);
                            if (assetHandle) {
                                const assetFile = await assetHandle.getFile();
                                const blob = assetFile.slice(0, assetFile.size, assetFile.type);
                                const blobUrl = URL.createObjectURL(blob);
                                activeBlobUrls.push(blobUrl);
                                el.setAttribute(attribute, blobUrl);
                            } else {
                                console.warn(`Asset not found: ${path}`);
                            }
                        } catch (e) {
                            console.warn(`Could not load asset: ${path}`, e);
                        }
                    });
                }
            });
            await Promise.all(assetPromises.map(p => p()));

            const finalHtml = new XMLSerializer().serializeToString(doc);
            const htmlBlob = new Blob([finalHtml], { type: 'text/html' });
            const htmlBlobUrl = URL.createObjectURL(htmlBlob);
            activeBlobUrls.push(htmlBlobUrl);

            iframe.src = htmlBlobUrl;
            updateStatus('Project rendered successfully.');

        } catch (e) {
            updateStatus(`Error rendering project: ${e.message}`, true);
            console.error(e);
        }
    }

    async function resolvePath(dirHandle, path) {
        const parts = path.split('/').filter(p => p && p !== '.');
        let currentHandle = dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (part === '..') {
                // This is a simplification and won't work for complex cases.
                // A real implementation would need to track the parent directory.
                console.warn('Parent directory (..) resolution is not fully supported.');
                continue;
            }
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        try {
            return await currentHandle.getFileHandle(parts[parts.length - 1]);
        } catch (e) {
            return null; // File not found
        }
    }
});
