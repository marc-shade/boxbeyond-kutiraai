// Documentation.jsx
import { Box, Typography, Stack, Card } from '@mui/material';
import { CodeOutlined } from '@mui/icons-material';
import {
    GlassmorphicCard,
} from 'themes/GlassmorphicComponents';
import platformArchImage from './platform_arch.drawio.png';

const Documentation = () => {
    const llamaTemplate = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>{question}<|eot_id|><|start_header_id|>assistant<|end_header_id|>{answer}<|eot_id|>`;

    const mistralTemplate = `<s>[INST] Question: {question} [/INST] {answer}</s>`;

    return (
        <Box>
            <Stack spacing={3} margin={3}>
                {/* Introduction Section */}
                <GlassmorphicCard>
                    <Box sx={{ p: 3 }}>  {/* Container with padding */}
                        <Typography variant="h4" gutterBottom>
                            Introduction
                        </Typography>
                        <Typography variant="body1">
                            This is a comprehensive platform providing capabilities from dataset generation, fine tuning,
                            build agentic workflow and integrating with enterprise applications using n8n and its off the
                            shelf connectors. The platform enables seamless integration of AI capabilities into your
                            existing enterprise ecosystem.
                        </Typography>
                    </Box>
                </GlassmorphicCard>


                {/* Architecture Section */}
                <GlassmorphicCard>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Architecture
                        </Typography>
                        <Box
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                border: '1px dashed rgba(255, 255, 255, 0.2)',
                                borderRadius: 2,
                                mb: 2,
                                backdropFilter: 'blur(10px)',
                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <Typography variant="body1">Architecture Diagram</Typography>
                            <Box
                                sx={{
                                    width: '100%',
                                    height: 300,
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mt: 2,
                                    borderRadius: 2
                                }}
                            >
                                <Box
                                    component="img"
                                    src={platformArchImage}
                                    alt="Architecture Diagram"
                                    sx={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: 2,
                                        filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.1))'
                                    }}
                                />

                            </Box>
                        </Box>
                    </Box>
                </GlassmorphicCard>

                {/* Technical Details Section */}
                <GlassmorphicCard>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Technical Details
                        </Typography>
                        <Stack spacing={2}>
                            {/* Dataset Templates */}
                            <GlassmorphicCard>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom>
                                        Dataset Templates for Fine Tuning
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                LLaMA 3.2 Template
                                            </Typography>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    '& pre': {
                                                        margin: 0,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        background: 'transparent'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CodeOutlined sx={{ mr: 1 }} />
                                                    <Typography variant="body2">Template Format</Typography>
                                                </Box>
                                                <pre>{llamaTemplate}</pre>
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                Mistral AI Template
                                            </Typography>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    '& pre': {
                                                        margin: 0,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        background: 'transparent'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CodeOutlined sx={{ mr: 1 }} />
                                                    <Typography variant="body2">Template Format</Typography>
                                                </Box>
                                                <pre>{mistralTemplate}</pre>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </GlassmorphicCard>

                            {/* N8N Workflow URL */}
                            <GlassmorphicCard>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom>
                                        Fetching N8N Workflow Production URL
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Typography variant="body1">
                                            To fetch the production URL of an n8n workflow:
                                        </Typography>
                                        <Box component="ol" sx={{ pl: 2 }}>
                                            <li>Open the n8n workflow in the UI</li>
                                            <li>Click on the "Workflow" button in the top menu</li>
                                            <li>Select "Settings" from the dropdown</li>
                                            <li>Navigate to the "Production" tab</li>
                                            <li>Copy the "Production Webhook URL"</li>
                                        </Box>
                                        <Box
                                            sx={{
                                                p: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.2)'
                                            }}
                                        >
                                            The production URL format will be: https://your-n8n-domain/webhook/workflow-id
                                        </Box>
                                    </Stack>
                                </Box>
                            </GlassmorphicCard>

                            {/* Ollama Connection */}
                            <GlassmorphicCard>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom>
                                        Connecting to Local Ollama from N8N Docker
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Typography variant="body1">
                                            When connecting to Ollama running locally while n8n is in Docker, use the special DNS name
                                            <Box component="code" sx={{ mx: 1, bgcolor: 'rgba(255, 255, 255, 0.1)', p: 0.5, borderRadius: 1 }}>
                                                host.docker.internal
                                            </Box>
                                            to access your local machine from within the container.
                                        </Typography>
                                        <Box
                                            sx={{
                                                p: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.2)'
                                            }}
                                        >
                                            <Typography variant="body2">Example URL format:</Typography>
                                            <Box
                                                component="code"
                                                sx={{
                                                    display: 'block',
                                                    mt: 1,
                                                    p: 1,
                                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                    borderRadius: 1
                                                }}
                                            >
                                                http://host.docker.internal:11434/api/generate
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                p: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderColor: 'warning.main'
                                            }}
                                        >
                                            Ensure your Docker container has network access to the host machine and Ollama is running on the default port 11434.
                                        </Box>
                                    </Stack>
                                </Box>
                            </GlassmorphicCard>
                        </Stack>
                    </Box>
                </GlassmorphicCard>
            </Stack>
        </Box>
    );
};

export default Documentation;
