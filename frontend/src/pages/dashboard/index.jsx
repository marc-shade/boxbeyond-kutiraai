// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import UniqueVisitorCard from './UniqueVisitorCard';
import SystemHealth from './SystemHealth';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

// API
import { dashboardAPI } from 'api/dashboard';
import { useState, useEffect } from 'react';

// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        if (response.status === 'success') {
          setStats(response.data);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh disabled - user can manually refresh the page if needed
    // const interval = setInterval(fetchDashboardData, 30000);
    // return () => clearInterval(interval);
  }, []);

  const calculatePercentage = (active, total) => {
    if (total === 0) return 0;
    return Math.round((active / total) * 100);
  };

  const getPercentageDisplay = (active, total) => {
    const percentage = calculatePercentage(active, total);
    // Always show percentage, even if 0
    return percentage;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid item xs={12} sx={{ mb: -2.25 }}>
        <Typography variant="h5">Dashboard</Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Total Agents"
            count={stats?.total_agents?.total?.toString() || "0"}
            percentage={getPercentageDisplay(stats?.total_agents?.active || 0, stats?.total_agents?.total || 0)}
            extra={`Active: ${stats?.total_agents?.active || 0}`}
            color="primary"
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Process Flows"
            count={stats?.process_flows?.total?.toString() || "0"}
            percentage={getPercentageDisplay(stats?.process_flows?.active || 0, stats?.process_flows?.total || 0)}
            extra={`Active: ${stats?.process_flows?.active || 0}`}
            color="secondary"
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Fine Tune Configs"
            count={stats?.finetune_configs?.total?.toString() || "0"}
            percentage={getPercentageDisplay(stats?.finetune_configs?.active || 0, stats?.finetune_configs?.total || 0)}
            color="success"
            extra={`Completed: ${stats?.finetune_configs?.active || 0}`}
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Dataset Configs"
            count={stats?.dataset_configs?.total?.toString() || "0"}
            percentage={getPercentageDisplay(stats?.dataset_configs?.active || 0, stats?.dataset_configs?.total || 0)}
            color="warning"
            extra={`Active: ${stats?.dataset_configs?.active || 0}`}
          />
        </GlassmorphicCard>
      </Grid>


      <Grid item md={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />

      {/* row 2 */}
      <Grid item xs={12} md={7} lg={8}>
        <MainCard>
          <UniqueVisitorCard />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={5} lg={4}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <MainCard>
              <SystemHealth />
            </MainCard>
          </Grid>

        </Grid>
      </Grid>

    </Grid>

  );
}
