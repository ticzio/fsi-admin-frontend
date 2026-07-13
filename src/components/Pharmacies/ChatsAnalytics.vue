<template>
  <div class="h-100 d-flex flex-column">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="fw-bold mb-0">Rendimiento de Chats Atendidos</h5>
        <small class="text-muted" style="font-size: 0.75rem;">
          Para ver los datos de un mes, coloca el cursor sobre el punto que representa el mes.
        </small>
      </div>
      <button
        v-if="isZoomed"
        class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
        style="font-size: 0.8rem; border-radius: 8px"
        @click="resetZoom"
      >
        <span>↺</span> Restablecer zoom
      </button>
    </div>
    <div class="flex-grow-1 w-100 min-h-0">
      <LineChart ref="lineChartRef" :series="series" :options="mergedOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import LineChart from '@/components/common/Charts/LineChart.vue'

interface Props {
  series: any[]
  options: ApexOptions
}

const props = defineProps<Props>()

const isZoomed = ref(false)
const lineChartRef = ref<InstanceType<typeof LineChart> | null>(null)

const resetZoom = () => {
  lineChartRef.value?.resetZoom()
  isZoomed.value = false
}

const mergedOptions = computed<ApexOptions>(() => {
  const baseOptions = props.options || {}
  const primaryColor = baseOptions.colors?.[0] || '#0d6efd'

  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      toolbar: {
        show: true,
        tools: { zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
        autoSelected: 'zoom',
        ...baseOptions.chart?.toolbar,
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
        ...baseOptions.chart?.zoom,
      },
      events: {
        ...baseOptions.chart?.events,
        dataPointMouseEnter: (event: any, chartContext: any, config: any) => {
          document.body.style.cursor = 'pointer'
          if (baseOptions.chart?.events?.dataPointMouseEnter) {
            baseOptions.chart.events.dataPointMouseEnter(event, chartContext, config)
          }
        },
        dataPointMouseLeave: (event: any, chartContext: any, config: any) => {
          document.body.style.cursor = 'default'
          if (baseOptions.chart?.events?.dataPointMouseLeave) {
            baseOptions.chart.events.dataPointMouseLeave(event, chartContext, config)
          }
        },
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const dataIndex: number = config.dataPointIndex
          if (dataIndex !== undefined && dataIndex >= 0) {
            const total = config.w.globals.series[0]?.length ?? 0
            if (total > 0) {
              const min = dataIndex + 1
              const max = Math.min(total, dataIndex + 3)
              chartContext.zoomX(min, max)
              isZoomed.value = true
            }
          }
          if (baseOptions.chart?.events?.dataPointSelection) {
            baseOptions.chart.events.dataPointSelection(event, chartContext, config)
          }
        },
      },
    },
    markers: {
      size: 6,
      hover: { size: 9 },
      strokeWidth: 3,
      colors: [primaryColor],
      strokeColors: ['#ffffff'],
      ...baseOptions.markers,
    },
    xaxis: {
      ...baseOptions.xaxis,
      crosshairs: {
        show: true,
        width: 1,
        position: 'back',
        stroke: { color: primaryColor, width: 1, dashArray: 4 },
        ...baseOptions.xaxis?.crosshairs,
      },
    },
    yaxis: {
      max: (val: number) => (val === 0 ? 5 : val + 5),
      ...baseOptions.yaxis,
    },
    tooltip: {
      enabled: true,
      intersect: true,
      shared: false,
      followCursor: false,
      ...baseOptions.tooltip,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const val = series[seriesIndex][dataPointIndex]
        const label = w.config.xaxis.categories?.[dataPointIndex] || w.globals.labels?.[dataPointIndex] || ''
        return `
          <div style="position: relative; z-index: 9999; background: ${primaryColor}; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2); border: 1px solid rgba(255, 255, 255, 0.2);">
            <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">${label}</div>
            <div>${val} chats</div>
          </div>
        `
      },
    },
    states: {
      hover: { filter: { type: 'lighten' } },
      ...baseOptions.states,
    },
  }
})
</script>

<style scoped>
.min-h-0 {
  min-height: 0;
}
</style>
