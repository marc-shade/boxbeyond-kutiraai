/**
 * MCP Configuration Dashboard
 * Unified management interface for Claude Desktop and Claude Code MCP configurations
 *
 * Features:
 * - View all MCP servers from both configs
 * - Add new servers to one or both configs
 * - Edit existing server configurations
 * - Delete servers from configs
 * - Sync servers between desktop and code
 * - View sync status and conflicts
 */

import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as SyncedIcon,
  Warning as OutOfSyncIcon,
  Computer as DesktopIcon,
  Code as CodeIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import mcpConfigAPI from 'api/mcp-config-api';
import { useSnackbar } from 'notistack';

// Tab panel component
function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MCPConfigDashboard = () => {
  const [servers, setServers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paths, setPaths] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'stdio',
    command: '',
    args: '',
    env: '',
    url: '',
    headers: '',
    description: '',
    targets: ['desktop', 'code']
  });

  const { enqueueSnackbar } = useSnackbar();

  // Load all MCP configurations
  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configsResult, pathsResult] = await Promise.all([
        mcpConfigAPI.getAllConfigs(),
        mcpConfigAPI.getConfigPaths()
      ]);

      setServers(configsResult.servers || {});
      setPaths(pathsResult.paths);

      if (configsResult.errors?.desktop) {
        console.warn('Desktop config error:', configsResult.errors.desktop);
      }
      if (configsResult.errors?.code) {
        console.warn('Code config error:', configsResult.errors.code);
      }
    } catch (err) {
      setError(err.message);
      enqueueSnackbar(`Failed to load configs: ${err.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle target checkbox change
  const handleTargetChange = (target) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.includes(target)
        ? prev.targets.filter(t => t !== target)
        : [...prev.targets, target]
    }));
  };

  // Add new server
  const handleAddServer = async () => {
    try {
      // Parse JSON fields
      const serverConfig = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        targets: formData.targets
      };

      if (formData.type === 'stdio') {
        serverConfig.command = formData.command;
        serverConfig.args = formData.args ? JSON.parse(formData.args) : [];
        serverConfig.env = formData.env ? JSON.parse(formData.env) : {};
      } else {
        serverConfig.url = formData.url;
        serverConfig.headers = formData.headers ? JSON.parse(formData.headers) : {};
      }

      // Validate
      const validation = mcpConfigAPI.validateServerConfig(serverConfig);
      if (!validation.valid) {
        enqueueSnackbar(validation.errors.join(', '), { variant: 'error' });
        return;
      }

      await mcpConfigAPI.addServer(serverConfig);
      enqueueSnackbar(`Server "${formData.name}" added successfully`, { variant: 'success' });

      setAddDialogOpen(false);
      resetForm();
      await loadConfigs();
    } catch (err) {
      enqueueSnackbar(`Failed to add server: ${err.message}`, { variant: 'error' });
    }
  };

  // Update server
  const handleUpdateServer = async () => {
    try {
      const updates = {
        description: formData.description,
        type: formData.type,
        targets: formData.targets
      };

      if (formData.type === 'stdio') {
        updates.command = formData.command;
        updates.args = formData.args ? JSON.parse(formData.args) : [];
        updates.env = formData.env ? JSON.parse(formData.env) : {};
      } else {
        updates.url = formData.url;
        updates.headers = formData.headers ? JSON.parse(formData.headers) : {};
      }

      await mcpConfigAPI.updateServer(selectedServer, updates);
      enqueueSnackbar(`Server "${selectedServer}" updated successfully`, { variant: 'success' });

      setEditDialogOpen(false);
      resetForm();
      await loadConfigs();
    } catch (err) {
      enqueueSnackbar(`Failed to update server: ${err.message}`, { variant: 'error' });
    }
  };

  // Delete server
  const handleDeleteServer = async () => {
    try {
      await mcpConfigAPI.removeServer(selectedServer, formData.targets);
      enqueueSnackbar(`Server "${selectedServer}" removed successfully`, { variant: 'success' });

      setDeleteDialogOpen(false);
      resetForm();
      await loadConfigs();
    } catch (err) {
      enqueueSnackbar(`Failed to remove server: ${err.message}`, { variant: 'error' });
    }
  };

  // Sync server
  const handleSyncServer = async (serverName, source, targets) => {
    try {
      await mcpConfigAPI.syncServer(serverName, source, targets);
      enqueueSnackbar(`Server "${serverName}" synced successfully`, { variant: 'success' });
      await loadConfigs();
    } catch (err) {
      enqueueSnackbar(`Failed to sync server: ${err.message}`, { variant: 'error' });
    }
  };

  // Sync all servers
  const handleSyncAll = async (source, target) => {
    try {
      const results = await mcpConfigAPI.syncAllServers(source, target);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed === 0) {
        enqueueSnackbar(`Synced ${successful} servers successfully`, { variant: 'success' });
      } else {
        enqueueSnackbar(`Synced ${successful} servers, ${failed} failed`, { variant: 'warning' });
      }

      await loadConfigs();
    } catch (err) {
      enqueueSnackbar(`Failed to sync all servers: ${err.message}`, { variant: 'error' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'stdio',
      command: '',
      args: '',
      env: '',
      url: '',
      headers: '',
      description: '',
      targets: ['desktop', 'code']
    });
    setSelectedServer(null);
  };

  // Open edit dialog
  const handleEditClick = (serverName, serverConfig) => {
    setSelectedServer(serverName);
    setFormData({
      name: serverName,
      type: serverConfig.type || 'stdio',
      command: serverConfig.command || '',
      args: serverConfig.args ? JSON.stringify(serverConfig.args) : '',
      env: serverConfig.env ? JSON.stringify(serverConfig.env) : '',
      url: serverConfig.url || '',
      headers: serverConfig.headers ? JSON.stringify(serverConfig.headers) : '',
      description: serverConfig.description || '',
      targets: serverConfig.sources
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (serverName, serverConfig) => {
    setSelectedServer(serverName);
    setFormData({
      ...formData,
      targets: serverConfig.sources
    });
    setDeleteDialogOpen(true);
  };

  // Filter servers by tab
  const getFilteredServers = () => {
    const serverList = Object.entries(servers);

    switch (tabValue) {
      case 0: // All
        return serverList;
      case 1: // Desktop only
        return serverList.filter(([, config]) =>
          config.sources.includes('desktop') && !config.sources.includes('code')
        );
      case 2: // Code only
        return serverList.filter(([, config]) =>
          config.sources.includes('code') && !config.sources.includes('desktop')
        );
      case 3: // Shared
        return serverList.filter(([, config]) =>
          config.sources.includes('desktop') && config.sources.includes('code')
        );
      case 4: // Out of sync
        return serverList.filter(([, config]) =>
          config.sources.length > 1 && config.synced === false
        );
      default:
        return serverList;
    }
  };

  // Server card component
  const ServerCard = ({ name, config }) => (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{name}</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEditClick(name, config)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDeleteClick(name, config)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Sources */}
          <Box display="flex" gap={1} flexWrap="wrap">
            {config.sources.includes('desktop') && (
              <Chip
                size="small"
                icon={<DesktopIcon />}
                label="Desktop"
                color="primary"
                variant="outlined"
              />
            )}
            {config.sources.includes('code') && (
              <Chip
                size="small"
                icon={<CodeIcon />}
                label="Code"
                color="secondary"
                variant="outlined"
              />
            )}
            {config.sources.length > 1 && (
              <Chip
                size="small"
                icon={config.synced ? <SyncedIcon /> : <OutOfSyncIcon />}
                label={config.synced ? 'Synced' : 'Out of sync'}
                color={config.synced ? 'success' : 'warning'}
              />
            )}
          </Box>

          {/* Type */}
          <Box>
            <Chip size="small" label={config.type || 'stdio'} />
          </Box>

          {/* Description */}
          {config.description && (
            <Typography variant="body2" color="text.secondary">
              {config.description}
            </Typography>
          )}

          {/* Config details */}
          <Divider />
          <Box>
            {config.command && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <strong>Command:</strong> {config.command}
              </Typography>
            )}
            {config.url && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <strong>URL:</strong> {config.url}
              </Typography>
            )}
            {config.args && config.args.length > 0 && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <strong>Args:</strong> [{config.args.join(', ')}]
              </Typography>
            )}
          </Box>

          {/* Sync actions */}
          {config.sources.length > 1 && !config.synced && (
            <Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<SyncIcon />}
                  onClick={() => handleSyncServer(name, 'desktop', ['code'])}
                >
                  Desktop → Code
                </Button>
                <Button
                  size="small"
                  startIcon={<SyncIcon />}
                  onClick={() => handleSyncServer(name, 'code', ['desktop'])}
                >
                  Code → Desktop
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const filteredServers = getFilteredServers();

  return (
    <MainCard
      title="MCP Configuration Manager"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<CloudSyncIcon />}
            onClick={() => handleSyncAll('desktop', 'code')}
          >
            Sync All
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
          >
            Add Server
          </Button>
          <IconButton size="small" onClick={loadConfigs} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      }
    >
      {/* Config paths info */}
      {paths && paths.desktop && paths.code && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Desktop:</strong> {paths.desktop.path || 'Not configured'} {paths.desktop.exists ? '✓' : '✗'}
          </Typography>
          <Typography variant="body2">
            <strong>Code:</strong> {paths.code.path || 'Not configured'} {paths.code.exists ? '✓' : '✗'}
          </Typography>
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`All (${Object.keys(servers).length})`} />
          <Tab label="Desktop Only" />
          <Tab label="Code Only" />
          <Tab label="Shared" />
          <Tab label="Out of Sync" />
        </Tabs>
      </Box>

      {/* Server grid */}
      <TabPanel value={tabValue} index={tabValue}>
        {filteredServers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No MCP servers found in this category
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredServers.map(([name, config]) => (
              <Grid item xs={12} md={6} lg={4} key={name}>
                <ServerCard name={name} config={config} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Add Server Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add MCP Server</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Server Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="stdio">stdio</MenuItem>
                <MenuItem value="sse">SSE</MenuItem>
                <MenuItem value="http">HTTP</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'stdio' ? (
              <>
                <TextField
                  label="Command"
                  value={formData.command}
                  onChange={(e) => handleFormChange('command', e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Arguments (JSON array)"
                  value={formData.args}
                  onChange={(e) => handleFormChange('args', e.target.value)}
                  placeholder='["arg1", "arg2"]'
                  fullWidth
                  multiline
                />
                <TextField
                  label="Environment Variables (JSON object)"
                  value={formData.env}
                  onChange={(e) => handleFormChange('env', e.target.value)}
                  placeholder='{"KEY": "value"}'
                  fullWidth
                  multiline
                />
              </>
            ) : (
              <>
                <TextField
                  label="URL"
                  value={formData.url}
                  onChange={(e) => handleFormChange('url', e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Headers (JSON object)"
                  value={formData.headers}
                  onChange={(e) => handleFormChange('headers', e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  fullWidth
                  multiline
                />
              </>
            )}

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
            />

            <FormGroup>
              <Typography variant="subtitle2" gutterBottom>
                Add to:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.targets.includes('desktop')}
                    onChange={() => handleTargetChange('desktop')}
                  />
                }
                label="Claude Desktop"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.targets.includes('code')}
                    onChange={() => handleTargetChange('code')}
                  />
                }
                label="Claude Code"
              />
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddServer} variant="contained">
            Add Server
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Server Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit MCP Server: {selectedServer}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="stdio">stdio</MenuItem>
                <MenuItem value="sse">SSE</MenuItem>
                <MenuItem value="http">HTTP</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'stdio' ? (
              <>
                <TextField
                  label="Command"
                  value={formData.command}
                  onChange={(e) => handleFormChange('command', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Arguments (JSON array)"
                  value={formData.args}
                  onChange={(e) => handleFormChange('args', e.target.value)}
                  placeholder='["arg1", "arg2"]'
                  fullWidth
                  multiline
                />
                <TextField
                  label="Environment Variables (JSON object)"
                  value={formData.env}
                  onChange={(e) => handleFormChange('env', e.target.value)}
                  placeholder='{"KEY": "value"}'
                  fullWidth
                  multiline
                />
              </>
            ) : (
              <>
                <TextField
                  label="URL"
                  value={formData.url}
                  onChange={(e) => handleFormChange('url', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Headers (JSON object)"
                  value={formData.headers}
                  onChange={(e) => handleFormChange('headers', e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  fullWidth
                  multiline
                />
              </>
            )}

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
            />

            <FormGroup>
              <Typography variant="subtitle2" gutterBottom>
                Update in:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.targets.includes('desktop')}
                    onChange={() => handleTargetChange('desktop')}
                  />
                }
                label="Claude Desktop"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.targets.includes('code')}
                    onChange={() => handleTargetChange('code')}
                  />
                }
                label="Claude Code"
              />
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateServer} variant="contained">
            Update Server
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete MCP Server</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{selectedServer}"?
          </Typography>
          <FormGroup sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Remove from:
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.targets.includes('desktop')}
                  onChange={() => handleTargetChange('desktop')}
                />
              }
              label="Claude Desktop"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.targets.includes('code')}
                  onChange={() => handleTargetChange('code')}
                />
              }
              label="Claude Code"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteServer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default MCPConfigDashboard;
