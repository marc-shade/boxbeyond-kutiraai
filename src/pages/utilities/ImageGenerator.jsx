import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid,
  Chip
} from '@mui/material';
import {
  ImageOutlined,
  CloudDownload,
  AutoFixHigh,
  Refresh,
  ZoomIn
} from '@mui/icons-material';
import { GlassmorphicPaper, GlassmorphicCard } from 'themes/GlassmorphicComponents';
import imageGenerationService from 'services/real-image-generation-service';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [size, setSize] = useState('1024x1024');
  const [style, setStyle] = useState('natural');
  const [quality, setQuality] = useState('standard');
  const [provider, setProvider] = useState('auto');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [styles, setStyles] = useState([]);
  const [jobStatus, setJobStatus] = useState(null);

  // Load available styles on mount
  useEffect(() => {
    const loadStyles = async () => {
      const result = await imageGenerationService.getAvailableStyles();
      if (result.success) {
        setStyles(result.styles);
      }
    };
    loadStyles();
  }, []);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setJobStatus('initializing');

    try {
      // Use real image generation service
      const result = await imageGenerationService.generateImage(prompt, {
        size,
        style,
        quality,
        provider: provider === 'auto' ? undefined : provider
      });

      if (result.success) {
        setGeneratedImage(result.image_url);
        setJobStatus('completed');

        // Monitor job status if needed
        if (result.job_id) {
          const statusInterval = setInterval(async () => {
            const status = await imageGenerationService.getJobStatus(result.job_id);
            if (status.success) {
              setJobStatus(status.job.status);
              if (status.job.status === 'completed' || status.job.status === 'failed') {
                clearInterval(statusInterval);
              }
            }
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error.message || 'Failed to generate image');
      setJobStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;

    const result = await imageGenerationService.enhancePrompt(prompt);
    if (result.success) {
      setEnhancedPrompt(result.enhanced_prompt);
      setPrompt(result.enhanced_prompt);
    }
  };

  const generateVariations = async () => {
    if (!generatedImage) return;

    setLoading(true);
    try {
      const result = await imageGenerationService.generateVariations(generatedImage, 4);
      if (result.success) {
        // Handle variations display
        console.log('Generated variations:', result.variations);
      }
    } catch (error) {
      setError('Failed to generate variations');
    } finally {
      setLoading(false);
    }
  };

  const upscaleImage = async () => {
    if (!generatedImage) return;

    setLoading(true);
    try {
      const result = await imageGenerationService.upscaleImage(generatedImage, 2);
      if (result.success) {
        setGeneratedImage(result.upscaled_url);
      }
    } catch (error) {
      setError('Failed to upscale image');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function to revoke object URL when component unmounts or when new image is generated
  React.useEffect(() => {
    return () => {
      if (generatedImage) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, [generatedImage]);

  return (
    <GlassmorphicCard>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <ImageOutlined />
            <Typography variant="h3">Image Generator</Typography>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your image description..."
            variant="outlined"
          />

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={enhancePrompt}
              startIcon={<AutoFixHigh />}
              disabled={loading || !prompt.trim()}
            >
              Enhance Prompt
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  label="Size"
                >
                  <MenuItem value="1024x1024">1024x1024</MenuItem>
                  <MenuItem value="1792x1024">1792x1024 (Wide)</MenuItem>
                  <MenuItem value="1024x1792">1024x1792 (Tall)</MenuItem>
                  <MenuItem value="2048x2048">2048x2048 (Large)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Style</InputLabel>
                <Select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  label="Style"
                >
                  {styles.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  label="Quality"
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="hd">HD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  label="Provider"
                >
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="openai">DALL-E 3</MenuItem>
                  <MenuItem value="stability">Stable Diffusion</MenuItem>
                  <MenuItem value="midjourney">Midjourney</MenuItem>
                  <MenuItem value="flux">FLUX</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={generateImage}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <ImageOutlined />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Generate Image
          </Button>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mt: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2, 
              my: 2 
            }}>
              <CircularProgress />
              <Typography>
                Generating your image... This may take a few minutes.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Please be patient as the model processes your request.
              </Typography>
            </Box>
          )}

          {generatedImage && !loading && (
            <GlassmorphicCard sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 2 
                }}>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={generateVariations}
                      disabled={loading}
                    >
                      Variations
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ZoomIn />}
                      onClick={upscaleImage}
                      disabled={loading}
                    >
                      Upscale 2x
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudDownload />}
                    href={generatedImage}
                    download="generated-image.png"
                  >
                    Download Image
                  </Button>
                  </Box>
                </Box>
              </CardContent>
            </GlassmorphicCard>
          )}
        </Box>
      </CardContent>
    </GlassmorphicCard>
  );
};

export default ImageGenerator;
