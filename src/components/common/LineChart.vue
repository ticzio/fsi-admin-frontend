<template>
  <div class="chart-responsive-wrapper">
    <Line :data="chartData" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const props = defineProps<{
  chartData: any
  chartOptions: any
}>()

const mergedOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.chartOptions,
}))
</script>

<style scoped>
.chart-responsive-wrapper {
  width: 100%;
  height: 100%;
  min-height: 200px;
  position: relative;
}

.chart-responsive-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
