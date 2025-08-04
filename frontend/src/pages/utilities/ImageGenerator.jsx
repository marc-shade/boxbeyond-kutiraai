import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  Alert
} from '@mui/material';
import { ImageOutlined, CloudDownload } from '@mui/icons-material';
import { GlassmorphicPaper, GlassmorphicCard } from 'themes/GlassmorphicComponents';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('http://localhost:8200/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to generate image');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      try {
        // Try to parse the error message if it's JSON
        const errorMessage = JSON.parse(error.message);
        if (errorMessage.services?.celery?.error) {
          setError(errorMessage.services.celery.error);
        } else {
          setError(error.message);
        }
      } catch {
        // If parsing fails, use the error message directly
        setError(error.message);
      }
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
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    href={generatedImage}
                    download="generated-image.png"
                  >
                    Download Image
                  </Button>
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
