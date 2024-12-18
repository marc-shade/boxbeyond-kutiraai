// DatasetView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';

const DatasetView = () => {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await fetch(`http://localhost:8200/api/v1/dataset_outputs/dataset/${id}`);
        if (!response.ok) throw new Error('Failed to fetch dataset');
        const data = await response.json();
        setDataset(data);
        const dataset_details = await fetch(`http://localhost:8200/api/v1/dataset_masters/${id}`)
        if (!dataset_details.ok) throw new Error('Failed to fetch dataset master details!');
        const data_details = await dataset_details.json();
        setDatasetDetails(data_details);
      } catch (error) {
        console.error('Error fetching dataset:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataset();
  }, [id]);

  const handleChunkClick = (chunk) => {
    setSelectedChunk(chunk);
  };

  const parseQAPairs = (jsonlContent) => {
    if (!jsonlContent || typeof jsonlContent !== 'string') {
      return [];
    }
  
    const pairs = jsonlContent.split('<s>').filter(pair => pair.trim() !== '');
    return pairs.map(pair => {
      const [instruction, answer] = pair.split('[/INST]').map(item => item?.trim() || '');
      const question = instruction
        ?.replace('[INST]', '')
        ?.replace(/^Question:\s*/i, '')
        ?.trim();
  
      const cleanedAnswer = answer
        ?.replace('</s>', '')
        ?.replace(/"$/, '') // Remove trailing double quote
        ?.trim();
  
      // Only return pairs where both question and answer are non-empty
      if (question && cleanedAnswer) {
        return { question, answer: cleanedAnswer };
      }
      return null;
    }).filter(Boolean); // Remove any null entries
  };

  if (loading) return <CircularProgress />;
  if (!dataset) return <Typography>Dataset not found</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>{datasetDetails.dataset_name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{datasetDetails.dataset_desc}</Typography>

      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {dataset.map((chunk, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{ height: '100%', cursor: 'pointer' }}
                  onClick={() => handleChunkClick(chunk)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Chunk {index + 1}</Typography>
                    <Typography variant="body2">
                      {chunk.chunk_text.split('\n').slice(0, 6).join('\n')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>Metadata & Q&A</Typography>
            {selectedChunk ? (
              <>
                <List>
                  <ListItem>
                    <ListItemText primary="Filename" secondary={selectedChunk.filename || 'N/A'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Creation Time" secondary={new Date().toLocaleString()} />
                  </ListItem>
                </List>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Q&A Pairs</Typography>
                {parseQAPairs(selectedChunk.jsonl_content).map((pair, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Q: {pair.question}</Typography>
                    <Typography variant="body1">A: {pair.answer}</Typography>
                  </Box>
                ))}
              </>
            ) : (
              <Typography>Select a chunk to view details</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DatasetView;