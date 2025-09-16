import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';

// chart options
const barChartOptions = {
  chart: {
    height: 450,
    type: 'bar',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded'
    }
  },
  dataLabels: {
    enabled: true
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  grid: {
    strokeDashArray: 0
  },
  legend: {
    show: false
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " items"
      }
    }
  }
};

// ==============================|| INCOME AREA CHART ||============================== //

export default function IncomeAreaChart({ chartData }) {
  const theme = useTheme();

  const { primary, secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [options, setOptions] = useState(barChartOptions);

  useEffect(() => {
    const categories = chartData && chartData.current ? chartData.current.categories :
      ['Total Agents', 'Process Flows', 'Fine Tune Configs', 'Dataset Configs'];

    setOptions((prevState) => ({
      ...prevState,
      colors: [theme.palette.primary.main],
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: Array(categories.length).fill(secondary)
          }
        },
        axisBorder: {
          show: true,
          color: line
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [secondary]
          }
        }
      },
      grid: {
        borderColor: line
      }
    }));
  }, [primary, secondary, line, theme, chartData]);

  const [series, setSeries] = useState([
    {
      name: 'Count',
      data: [0, 0, 0, 0]
    }
  ]);

  useEffect(() => {
    if (chartData && chartData.current && chartData.current.series) {
      setSeries(chartData.current.series);
    } else {
      // Fallback data
      setSeries([
        {
          name: 'Count',
          data: [0, 0, 0, 0]
        }
      ]);
    }
  }, [chartData]);

  return <ReactApexChart options={options} series={series} type="bar" height={450} />;
}

IncomeAreaChart.propTypes = {
  chartData: PropTypes.object
};
