import httpProxy from 'http-proxy';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Python FastAPI service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_CONVERTER_URL || 'http://127.0.0.1:8000';

// Create proxy instance (singleton, reusable)
const proxy = httpProxy.createProxyServer({
    target: PYTHON_SERVICE_URL,
    changeOrigin: true,
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
        res.status(500).json({ 
            error: 'Proxy error: ' + err.message 
        });
    }
});

// Log requests for debugging
proxy.on('proxyReq', (proxyReq, req, res) => {
    // Rewrite path: /api/convert -> /convert
    proxyReq.path = '/convert';
    console.log('Proxying POST to:', `${PYTHON_SERVICE_URL}/convert`);
});

proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log('Response status:', proxyRes.statusCode);
});

export default function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return promise for async handling
    return new Promise((resolve) => {
        let resolved = false;

        const onComplete = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };

        // Handle proxy errors via event handler (already set up above)
        // The error handler will send response if needed

        // Proxy the request
        proxy.web(req, res, {
            target: PYTHON_SERVICE_URL, // Base URL only, path will be rewritten in proxyReq
            selfHandleResponse: false,
        }, (err) => {
            // Error callback - called if proxy setup fails
            if (err) {
                console.error('Proxy setup error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'Failed to proxy request: ' + err.message 
                    });
                }
            }
            onComplete();
        });

        // Handle response completion
        res.on('finish', onComplete);
        res.on('close', onComplete);
    });
}
