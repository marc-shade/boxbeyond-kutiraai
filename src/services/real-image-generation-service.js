/**
 * Real Image Generation Service
 * Implements actual AI image generation with multiple providers
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

class RealImageGenerationService {
  constructor() {
    this.providers = {
      'openai': {
        name: 'DALL-E 3',
        models: ['dall-e-3', 'dall-e-2'],
        maxResolution: '1792x1024',
        costPerImage: 0.04
      },
      'stability': {
        name: 'Stable Diffusion XL',
        models: ['sdxl', 'sd-1.5'],
        maxResolution: '1024x1024',
        costPerImage: 0.02
      },
      'midjourney': {
        name: 'Midjourney',
        models: ['v6', 'v5.2'],
        maxResolution: '1024x1024',
        costPerImage: 0.03
      },
      'flux': {
        name: 'FLUX',
        models: ['schnell', 'pro'],
        maxResolution: '2048x2048',
        costPerImage: 0.01
      }
    };

    this.generationHistory = new Map();
    this.activeJobs = new Map();
  }

  /**
   * Generate image using best available provider
   */
  async generateImage(prompt, options = {}) {
    try {
      const jobId = `img_${Date.now()}`;

      const job = {
        id: jobId,
        prompt: prompt,
        status: 'initializing',
        provider: options.provider || 'auto',
        model: options.model || 'auto',
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'natural',
        negative_prompt: options.negative_prompt || '',
        seed: options.seed || Math.floor(Math.random() * 1000000),
        created_at: new Date().toISOString()
      };

      this.activeJobs.set(jobId, job);

      // Try MCP image generation first
      const mcpResult = await this.generateWithMCP(prompt, options);

      if (mcpResult.success) {
        job.status = 'completed';
        job.image_url = mcpResult.image_url;
        job.provider_used = 'mcp_image_gen';
        job.completed_at = new Date().toISOString();

        this.activeJobs.set(jobId, job);
        this.saveToHistory(job);

        return {
          success: true,
          job_id: jobId,
          image_url: mcpResult.image_url,
          provider: job.provider_used
        };
      }

      // Fallback to API providers
      const apiResult = await this.generateWithAPI(prompt, options);

      if (apiResult.success) {
        job.status = 'completed';
        job.image_url = apiResult.image_url;
        job.provider_used = apiResult.provider;
        job.completed_at = new Date().toISOString();

        this.activeJobs.set(jobId, job);
        this.saveToHistory(job);

        return {
          success: true,
          job_id: jobId,
          image_url: apiResult.image_url,
          provider: job.provider_used
        };
      }

      // If all fail, generate placeholder
      job.status = 'failed';
      job.error = 'No providers available';

      return {
        success: false,
        error: 'Image generation failed',
        job_id: jobId
      };

    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate using MCP image generation service
   */
  async generateWithMCP(prompt, options) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/execute`, {
        service: 'image-gen',
        tool: 'smart_generate_image',
        params: {
          prompt: prompt,
          width: parseInt(options.size?.split('x')[0]) || 1024,
          height: parseInt(options.size?.split('x')[1]) || 1024,
          quality: options.quality || 'standard',
          prefer_free: options.prefer_free || false,
          max_cost: options.max_cost || 0.15
        }
      });

      if (response.data.success && response.data.result?.image_url) {
        return {
          success: true,
          image_url: response.data.result.image_url,
          provider: response.data.result.provider
        };
      }

      return { success: false };
    } catch (error) {
      console.error('MCP image generation failed:', error);
      return { success: false };
    }
  }

  /**
   * Generate using direct API providers
   */
  async generateWithAPI(prompt, options) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/image/generate`, {
        prompt: prompt,
        provider: options.provider || 'auto',
        model: options.model,
        size: options.size,
        quality: options.quality,
        style: options.style
      });

      if (response.data.success) {
        return {
          success: true,
          image_url: response.data.image_url,
          provider: response.data.provider
        };
      }

      return { success: false };
    } catch (error) {
      console.error('API image generation failed:', error);
      return { success: false };
    }
  }

  /**
   * Enhance prompt using AI
   */
  async enhancePrompt(basePrompt) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/image/enhance-prompt`, {
        prompt: basePrompt
      });

      if (response.data.success) {
        return {
          success: true,
          enhanced_prompt: response.data.enhanced_prompt,
          suggestions: response.data.suggestions || []
        };
      }

      // Fallback enhancement
      return {
        success: true,
        enhanced_prompt: `${basePrompt}, highly detailed, professional photography, 8k resolution, award winning`,
        suggestions: [
          'Add lighting details',
          'Specify art style',
          'Include color palette',
          'Add composition details'
        ]
      };
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
      return {
        success: false,
        enhanced_prompt: basePrompt
      };
    }
  }

  /**
   * Generate variations of an image
   */
  async generateVariations(imageUrl, count = 4) {
    try {
      const variations = [];

      for (let i = 0; i < count; i++) {
        const response = await axios.post(`${API_BASE_URL}/api/image/variation`, {
          image_url: imageUrl,
          variation_strength: 0.3 + (i * 0.1)
        });

        if (response.data.success) {
          variations.push({
            url: response.data.image_url,
            variation_id: `var_${Date.now()}_${i}`
          });
        }
      }

      return {
        success: true,
        variations: variations
      };
    } catch (error) {
      console.error('Variation generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upscale image resolution
   */
  async upscaleImage(imageUrl, scale = 2) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/image/upscale`, {
        image_url: imageUrl,
        scale_factor: scale
      });

      if (response.data.success) {
        return {
          success: true,
          upscaled_url: response.data.image_url,
          new_resolution: response.data.resolution
        };
      }

      return {
        success: false,
        error: 'Upscaling failed'
      };
    } catch (error) {
      console.error('Image upscaling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Edit existing image with prompt
   */
  async editImage(imageUrl, editPrompt, mask = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/image/edit`, {
        image_url: imageUrl,
        prompt: editPrompt,
        mask_url: mask
      });

      if (response.data.success) {
        return {
          success: true,
          edited_url: response.data.image_url
        };
      }

      return {
        success: false,
        error: 'Image editing failed'
      };
    } catch (error) {
      console.error('Image editing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get generation status
   */
  async getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      // Try to fetch from server
      try {
        const response = await axios.get(`${API_BASE_URL}/api/image/status/${jobId}`);
        return {
          success: true,
          job: response.data.job
        };
      } catch (error) {
        return {
          success: false,
          error: 'Job not found'
        };
      }
    }

    return {
      success: true,
      job: job
    };
  }

  /**
   * Get available styles
   */
  async getAvailableStyles() {
    return {
      success: true,
      styles: [
        { id: 'natural', name: 'Natural', description: 'Realistic and natural looking' },
        { id: 'artistic', name: 'Artistic', description: 'Artistic interpretation' },
        { id: 'anime', name: 'Anime', description: 'Japanese anime style' },
        { id: 'cartoon', name: 'Cartoon', description: 'Cartoon illustration' },
        { id: 'photographic', name: 'Photographic', description: 'Professional photography' },
        { id: 'cinematic', name: 'Cinematic', description: 'Cinematic and dramatic' },
        { id: 'fantasy', name: 'Fantasy', description: 'Fantasy art style' },
        { id: 'scifi', name: 'Sci-Fi', description: 'Science fiction themed' },
        { id: 'abstract', name: 'Abstract', description: 'Abstract art' },
        { id: 'watercolor', name: 'Watercolor', description: 'Watercolor painting' },
        { id: 'oil_painting', name: 'Oil Painting', description: 'Classical oil painting' },
        { id: '3d', name: '3D Render', description: '3D rendered style' }
      ]
    };
  }

  /**
   * Get prompt templates
   */
  async getPromptTemplates() {
    return {
      success: true,
      templates: [
        {
          category: 'Portrait',
          templates: [
            'Portrait of {subject}, professional photography, soft lighting',
            'Headshot of {subject}, studio lighting, high resolution',
            '{subject} in {style} art style, detailed face, expressive eyes'
          ]
        },
        {
          category: 'Landscape',
          templates: [
            '{location} landscape, golden hour, dramatic sky',
            'Scenic view of {location}, {season}, {weather}',
            '{location} at {time_of_day}, atmospheric, cinematic'
          ]
        },
        {
          category: 'Product',
          templates: [
            '{product} product photography, white background, professional',
            '{product} in {environment}, lifestyle photography',
            'Close-up of {product}, macro photography, detailed texture'
          ]
        },
        {
          category: 'Concept Art',
          templates: [
            'Concept art of {subject}, {style}, detailed design',
            'Character design of {character}, full body, reference sheet',
            'Environment concept of {location}, {mood}, atmospheric'
          ]
        }
      ]
    };
  }

  /**
   * Estimate generation cost
   */
  async estimateCost(options) {
    const provider = options.provider || 'openai';
    const count = options.count || 1;

    const providerInfo = this.providers[provider];
    if (!providerInfo) {
      return {
        success: false,
        error: 'Unknown provider'
      };
    }

    const baseCost = providerInfo.costPerImage;
    const qualityMultiplier = options.quality === 'hd' ? 2 : 1;
    const totalCost = baseCost * qualityMultiplier * count;

    return {
      success: true,
      estimate: {
        provider: providerInfo.name,
        base_cost: baseCost,
        quality_multiplier: qualityMultiplier,
        count: count,
        total_cost: totalCost.toFixed(2),
        currency: 'USD'
      }
    };
  }

  /**
   * Get generation history
   */
  async getHistory(limit = 20) {
    const history = Array.from(this.generationHistory.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    return {
      success: true,
      history: history
    };
  }

  /**
   * Save to history
   */
  saveToHistory(job) {
    this.generationHistory.set(job.id, {
      id: job.id,
      prompt: job.prompt,
      image_url: job.image_url,
      provider: job.provider_used,
      created_at: job.created_at,
      settings: {
        size: job.size,
        quality: job.quality,
        style: job.style
      }
    });

    // Keep only last 100 items
    if (this.generationHistory.size > 100) {
      const firstKey = this.generationHistory.keys().next().value;
      this.generationHistory.delete(firstKey);
    }
  }

  /**
   * Delete from history
   */
  async deleteFromHistory(jobId) {
    if (this.generationHistory.has(jobId)) {
      this.generationHistory.delete(jobId);
      return {
        success: true,
        message: 'Deleted from history'
      };
    }

    return {
      success: false,
      error: 'Job not found in history'
    };
  }

  /**
   * Download image
   */
  async downloadImage(imageUrl, filename) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `image_${Date.now()}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return {
        success: true,
        message: 'Image downloaded successfully'
      };
    } catch (error) {
      console.error('Image download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const imageGenerationService = new RealImageGenerationService();

export default imageGenerationService;