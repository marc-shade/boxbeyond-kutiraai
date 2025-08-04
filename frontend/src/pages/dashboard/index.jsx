// material-ui
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project import
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import UniqueVisitorCard from './UniqueVisitorCard';

// assets
import avatar1 from 'assets/images/users/avatar-1.png';
import avatar2 from 'assets/images/users/avatar-2.png';
import avatar3 from 'assets/images/users/avatar-3.png';
import avatar4 from 'assets/images/users/avatar-4.png';
import SystemHealth from './SystemHealth';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

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
            count="24"
            percentage={12.5}
            extra="Active: 18"
            color="primary"
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Process Flows"
            count="156"
            percentage={28.5}
            extra="Active: 89"
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Fine Tune Configs"
            count="47"
            percentage={15.2}
            color="success"
            extra="In Use: 32"
          />
        </GlassmorphicCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <GlassmorphicCard>
          <AnalyticEcommerce
            title="Dataset Configs"
            count="93"
            percentage={32.1}
            color="primary"
            extra="Active: 78"
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
          <Grid item>
            <MainCard>
              <Stack spacing={3}>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Stack>
                      <Typography variant="h5" noWrap>
                        Help & Support Chat
                      </Typography>
                      <Typography variant="caption" color="secondary" noWrap>
                        Typical replay within 5 min
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item>
                    <AvatarGroup sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                      <Avatar alt="Remy Sharp" src={avatar1} />
                      <Avatar alt="Travis Howard" src={avatar2} />
                      <Avatar alt="Cindy Baker" src={avatar3} />
                      <Avatar alt="Agnes Walker" src={avatar4} />
                    </AvatarGroup>
                  </Grid>
                </Grid>
                <Button size="small" variant="contained" sx={{ textTransform: 'capitalize' }}>
                  Need Help?
                </Button>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>

    </Grid>

  );
}
