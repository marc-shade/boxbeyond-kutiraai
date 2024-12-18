// WorkflowExecutionPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Paper,
    Grid,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const WorkflowExecutionPage = () => {
    const { workflowId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('test');
    const [workflow, setWorkflow] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [trainingIterations, setTrainingIterations] = useState(1);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWorkflow = async () => {
            try {
                const response = await fetch(`http://localhost:8100/workflows/${workflowId}`);
                const data = await response.json();
                setWorkflow(data);

                // Initialize input values
                const initialInputs = {};
                data.config.inputs.forEach(input => {
                    initialInputs[input.name] = '';
                });
                setInputValues(initialInputs);
            } catch (error) {
                console.error('Error fetching workflow:', error);
                setError('Failed to load workflow');
            }
        };

        fetchWorkflow();
    }, [workflowId]);

    const handleInputChange = (inputName, value) => {
        setInputValues(prev => ({
            ...prev,
            [inputName]: value
        }));
    };

    const handleExecute = async (mode) => {
        setIsExecuting(true);
        setError(null);
        setExecutionResult(null);

        try {
            const endpoint = mode === 'test'
                ? `http://localhost:8100/workflows/execute`  // Updated endpoint
                : `http://localhost:8100/workflows/train`;

            // Different payload structure for test and train
            const payload = mode === 'test'
                ? {
                    workflow_name: workflow.name,  // Use the workflow name
                    inputs: inputValues,
                    trace: true
                }
                : {
                    workflow_name: workflow.name,
                    inputs: inputValues,
                    iterations: trainingIterations,
                    trace: true
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Failed to ${mode} workflow`);
            }

            const result = await response.json();
            setExecutionResult(result);
        } catch (error) {
            console.error(`Error ${mode}ing workflow:`, error);
            setError(`Failed to ${mode} workflow: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    // Add validation before executing
    const validateInputs = () => {
        const emptyInputs = Object.entries(inputValues)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (emptyInputs.length > 0) {
            setError(`Please fill in the following inputs: ${emptyInputs.join(', ')}`);
            return false;
        }
        return true;
    };

    // Update the execute button click handler
    const handleExecuteClick = (mode) => {
        if (!validateInputs()) {
            return;
        }
        handleExecute(mode);
    };

    // Update the results section to match the API response structure
    const ExecutionResults = ({ result, traces, tokenUsage }) => (
        <Box>
            {/* Final Output with enhanced styling */}
            <FinalOutput result={result} />

            {/* Execution Traces */}
            <Card>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{
                        px: 3,
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            Execution Traces
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{
                            maxHeight: '400px',
                            overflow: 'auto',
                            '& pre': { margin: 0 }
                        }}>
                            {traces.map((trace, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        '&:last-child': { mb: 0 }
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1
                                    }}>
                                        <Typography
                                            variant="subtitle2"
                                            color="primary"
                                            sx={{ fontWeight: 'medium' }}
                                        >
                                            Task: {trace.task}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {new Date(trace.timestamp).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.100',
                                        fontFamily: 'Source Code Pro, Monaco, monospace',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        {trace.output}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
            {/* Token Usage Metrics */}
            {tokenUsage && <TokenUsage metrics={tokenUsage.metrics} />}
        </Box>
    );

    const StyledOutput = ({ content }) => (
        <Box
            sx={{
                fontFamily: 'Source Code Pro, Monaco, monospace', // Better coding font
                fontSize: '14px',
                lineHeight: '1.6',
                backgroundColor: '#282c34', // Dark background
                color: '#abb2bf', // Light text color
                borderRadius: '8px',
                p: 2,
                overflow: 'auto',
                '& pre': {
                    margin: 0,
                    whiteSpace: 'pre-wrap', // Enable word wrap
                    wordWrap: 'break-word', // Ensure long words break
                    wordBreak: 'break-word',
                },
                '& .string': { color: '#98c379' }, // Green for strings
                '& .number': { color: '#d19a66' }, // Orange for numbers
                '& .boolean': { color: '#56b6c2' }, // Cyan for booleans
                '& .null': { color: '#c678dd' }, // Purple for null
                '& .key': { color: '#e06c75' }, // Red for keys
            }}
        >
            <pre>
                {formatJSON(content)}
            </pre>
        </Box>
    );

    const formatJSON = (content) => {
        if (typeof content === 'string') {
            return content;
        }

        try {
            const formatted = JSON.stringify(content, null, 2);
            return formatted.replace(
                /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
                (match) => {
                    let cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return `<span class="${cls}">${match}</span>`;
                }
            );
        } catch (e) {
            return String(content);
        }
    };

    // Update the Final Output card
    const FinalOutput = ({ result }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = async () => {
            try {
                const textToCopy = typeof result.final_output === 'string'
                    ? result.final_output
                    : JSON.stringify(result.final_output, null, 2);
                await navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        };

        return (
            <Card sx={{ mb: 2, overflow: 'hidden' }}>
                <CardContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Box sx={{
                        px: 3,
                        py: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            Final Output
                        </Typography>
                        <Button
                            size="small"
                            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                            onClick={handleCopy}
                            color={copied ? "success" : "primary"}
                            variant="outlined"
                            sx={{
                                minWidth: '100px',
                                transition: 'all 0.2s',
                            }}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 3 }}>
                        <StyledOutput content={result.final_output} />
                    </Box>
                </CardContent>
            </Card>
        );
    };

    // Add a TokenUsage component
    const TokenUsage = ({ metrics }) => {
        // Helper function to parse the metrics string into an object
        const parseMetrics = (metricsString) => {
            const pairs = metricsString.split(' ');
            return pairs.reduce((acc, pair) => {
                const [key, value] = pair.split('=');
                acc[key] = parseInt(value) || value;
                return acc;
            }, {});
        };

        const metrics_obj = parseMetrics(metrics);

        return (
            <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{
                        px: 3,
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            Token Usage Metrics
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            {Object.entries(metrics_obj).map(([key, value]) => (
                                <Grid item xs={12} sm={6} md={4} key={key}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'grey.50',
                                            border: '1px solid',
                                            borderColor: 'grey.200',
                                            borderRadius: 1,
                                            height: '100%'
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                display: 'block',
                                                mb: 1
                                            }}
                                        >
                                            {key.split('_').join(' ')}
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color="primary"
                                            sx={{ fontWeight: 'medium' }}
                                        >
                                            {value}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    {workflow?.name} Execution
                </Typography>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Test" value="test" />
                    <Tab label="Train" value="train" />
                </Tabs>
            </Box>

            <Grid container spacing={3}>
                {/* Left Panel - Inputs */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Input Parameters
                        </Typography>

                        {workflow?.config?.inputs.map(input => (
                            <TextField
                                key={input.name}
                                fullWidth
                                label={input.name}
                                value={inputValues[input.name] || ''}
                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                sx={{ mb: 2 }}
                                helperText={input.description}
                            />
                        ))}

                        {activeTab === 'train' && (
                            <TextField
                                fullWidth
                                type="number"
                                label="Training Iterations"
                                value={trainingIterations}
                                onChange={(e) => setTrainingIterations(Number(e.target.value))}
                                InputProps={{ inputProps: { min: 1 } }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        <Button
                            variant="contained"
                            onClick={() => handleExecuteClick(activeTab)}
                            disabled={isExecuting}
                            sx={{ mt: 2 }}
                        >
                            {isExecuting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                activeTab === 'test' ? 'Test Workflow' : 'Train Workflow'
                            )}
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Panel - Results */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, minHeight: '500px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Execution Results
                            </Typography>
                            {executionResult && (
                                <Typography variant="subtitle2" color="text.secondary">
                                    Workflow Version: {executionResult.workflow_version}
                                </Typography>
                            )}
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {isExecuting && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {executionResult && !isExecuting && (
                            <ExecutionResults
                                result={executionResult.result}
                                traces={executionResult.traces}
                                tokenUsage={executionResult.token_usage}
                            />
                        )}

                        {!error && !executionResult && !isExecuting && (
                            <Typography color="text.secondary" align="center">
                                Execute the workflow to see results
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default WorkflowExecutionPage;
