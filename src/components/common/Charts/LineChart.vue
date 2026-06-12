<template>
  <div ref="chartWrapper" class="chart-responsive-wrapper">
    <apexchart
      ref="chartRef"
      :type="type"
      width="100%"
      height="100%"
      :series="series"
      :options="mergedOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

const apexchart = VueApexCharts
const chartWrapper = ref<HTMLElement | null>(null)
const chartRef = ref<any>(null)
let observer: MutationObserver | null = null

/**
 * Remove the <title> element ApexCharts places inside the SVG.
 * Browsers render it as a native tooltip on hover ("Chart").
 */
const removeSvgTitle = () => {
  if (!chartWrapper.value) return
  chartWrapper.value.querySelectorAll('svg > title').forEach((el) => el.remove())
}

onMounted(() => {
  removeSvgTitle()
  if (chartWrapper.value) {
    observer = new MutationObserver(removeSvgTitle)
    observer.observe(chartWrapper.value, { childList: true, subtree: true })
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const resetZoom = () => {
  const total = props.series[0]?.data?.length ?? 0
  if (total > 0) {
    chartRef.value?.chart?.zoomX(1, total)
  }
}

defineExpose({
  chartRef,
  resetZoom,
})

type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'candlestick'
  | 'boxPlot'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap'

const props = defineProps<{
  type?: ChartType
  series: any[]
  options?: ApexOptions
}>()

const mergedOptions = computed<ApexOptions>(() => ({
  ...props.options,
  chart: {
    ...props.options?.chart,
    type: props.type ?? 'line',
    toolbar: { show: false, ...props.options?.chart?.toolbar },
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
