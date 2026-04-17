<template>
  <div class="chart-responsive-wrapper">
    <apexchart type="donut" width="100%" height="100%" :series="series" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

const props = defineProps<{
  series: number[]
  labels?: string[]
  options?: ApexCharts.ApexOptions
}>()

const mergedOptions = computed<ApexCharts.ApexOptions>(() => ({
  ...props.options,
  chart: {
    ...props.options?.chart,
    type: 'donut',
    toolbar: { show: false, ...props.options?.chart?.toolbar },
  },
  labels: props.labels ?? props.options?.labels ?? [],
  legend: { position: 'bottom', ...props.options?.legend },
  dataLabels: { enabled: true, ...props.options?.dataLabels },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        ...props.options?.plotOptions?.pie?.donut,
      },
      ...props.options?.plotOptions?.pie,
    },
    ...props.options?.plotOptions,
  },
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
