<template>
  <div class="chart-responsive-wrapper">
    <apexchart type="bar" width="100%" height="100%" :series="series" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

const props = defineProps<{
  series: any[]
  options?: ApexCharts.ApexOptions
}>()

const mergedOptions = computed<ApexCharts.ApexOptions>(() => ({
  ...props.options,
  chart: {
    ...props.options?.chart,
    type: 'bar',
    toolbar: { show: false, ...props.options?.chart?.toolbar },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '55%',
      ...props.options?.plotOptions?.bar,
    },
    ...props.options?.plotOptions,
  },
  dataLabels: { enabled: false, ...props.options?.dataLabels },
  legend: { show: false, ...props.options?.legend },
  grid: {
    borderColor: '#f0f0f0',
    xaxis: { lines: { show: false } },
    ...props.options?.grid,
  },
  xaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: '#999', fontSize: '10px' },
    },
    ...props.options?.xaxis,
  },
  yaxis: {
    labels: {
      style: { colors: '#999', fontSize: '10px' },
    },
    ...props.options?.yaxis,
  },
  tooltip: { theme: 'light', ...props.options?.tooltip },
}))
</script>

<style scoped>
.chart-responsive-wrapper {
  width: 100%;
  height: 100%;
  min-height: 200px;
  position: relative;
}
</style>
