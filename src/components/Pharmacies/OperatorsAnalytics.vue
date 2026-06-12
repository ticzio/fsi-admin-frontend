<template>
  <div class="operators-root d-flex flex-column h-100">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Líderes de Atención</h5>
        <p class="text-muted small mb-0">Ranking de operadores por chats atendidos</p>
      </div>
      <span class="badge-total">
        <i class="bi bi-people-fill me-1"></i>
        {{ operators.length }} operadores
      </span>
    </div>

    <!-- Podium: Top 3 -->
    <div v-if="top3.length" class="podium-row mb-4">
      <!-- 2nd Place -->
      <div v-if="top3[1]" class="podium-card podium-silver">
        <div class="podium-rank silver">2</div>
        <div class="avatar-wrap silver">
          <img
            :src="top3[1].url_image || defaultAvatar(top3[1].name)"
            :alt="top3[1].name"
            class="avatar-img"
            @error="(e) => ((e.target as HTMLImageElement).src = defaultAvatar(top3[1].name))"
          />
        </div>
        <p class="op-name">{{ top3[1].name }}</p>
        <div class="chat-chip silver-chip">
          <i class="bi bi-chat-left-dots-fill me-1"></i>{{ top3[1].chats_count }}
        </div>
      </div>

      <!-- 1st Place -->
      <div v-if="top3[0]" class="podium-card podium-gold podium-center">
        <div class="crown-icon">👑</div>
        <div class="podium-rank gold">1</div>
        <div class="avatar-wrap gold">
          <img
            :src="top3[0].url_image || defaultAvatar(top3[0].name)"
            :alt="top3[0].name"
            class="avatar-img"
            @error="(e) => ((e.target as HTMLImageElement).src = defaultAvatar(top3[0].name))"
          />
        </div>
        <p class="op-name fw-bold">{{ top3[0].name }}</p>
        <div class="chat-chip gold-chip">
          <i class="bi bi-chat-left-dots-fill me-1"></i>{{ top3[0].chats_count }}
        </div>
      </div>

      <!-- 3rd Place -->
      <div v-if="top3[2]" class="podium-card podium-bronze">
        <div class="podium-rank bronze">3</div>
        <div class="avatar-wrap bronze">
          <img
            :src="top3[2].url_image || defaultAvatar(top3[2].name)"
            :alt="top3[2].name"
            class="avatar-img"
            @error="(e) => ((e.target as HTMLImageElement).src = defaultAvatar(top3[2].name))"
          />
        </div>
        <p class="op-name">{{ top3[2].name }}</p>
        <div class="chat-chip bronze-chip">
          <i class="bi bi-chat-left-dots-fill me-1"></i>{{ top3[2].chats_count }}
        </div>
      </div>
    </div>

    <!-- Rest of operators: list with progress bars -->
    <div v-if="rest.length" class="ops-list flex-grow-1 overflow-y-auto custom-scrollbar">
      <div
        v-for="op in rest"
        :key="op.name"
        class="op-row"
      >
        <span class="op-position">{{ op.position }}</span>
        <img
          :src="op.url_image || defaultAvatar(op.name)"
          :alt="op.name"
          class="op-avatar"
          @error="(e) => ((e.target as HTMLImageElement).src = defaultAvatar(op.name))"
        />
        <div class="op-info">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="op-list-name">{{ op.name }}</span>
            <span class="op-chats">{{ op.chats_count }} chats</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: percentage(op.chats_count) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Operator {
  name: string
  position: number
  chats_count: number
  url_image: string
}

interface Props {
  operators: Operator[]
}

const props = defineProps<Props>()

const sorted = computed(() =>
  [...props.operators].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
)

const top3 = computed(() => sorted.value.slice(0, 3))
const rest = computed(() => sorted.value.slice(3))

const maxChats = computed(() => Math.max(...props.operators.map((o) => o.chats_count || 0), 1))

const percentage = (count: number) => Math.round((count / maxChats.value) * 100)

const defaultAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff&size=128&bold=true`
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.operators-root {
  min-height: 0;
}

/* ── Badge total ──────────────────────────────────────────────────── */
.badge-total {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  background: #e9f0ff;
  color: #0d6efd;
}

/* ── Podium row ───────────────────────────────────────────────────── */
.podium-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
}

.podium-card {
  flex: 1;
  max-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px 14px;
  border-radius: 20px;
  border: 1.5px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.podium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.podium-gold {
  background: linear-gradient(145deg, #fffbeb, #fef3c7);
  border-color: #fbbf24;
}
.podium-silver {
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border-color: #94a3b8;
}
.podium-bronze {
  background: linear-gradient(145deg, #fff7f0, #fde8d8);
  border-color: #f97316;
}

.podium-center {
  padding-top: 24px;
  padding-bottom: 18px;
}

.crown-icon {
  position: absolute;
  top: -18px;
  font-size: 1.5rem;
  animation: float 2.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
}

/* ── Rank badge ───────────────────────────────────────────────────── */
.podium-rank {
  font-size: 0.7rem;
  font-weight: 800;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.podium-rank.gold   { background: #fbbf24; color: #fff; }
.podium-rank.silver { background: #94a3b8; color: #fff; }
.podium-rank.bronze { background: #f97316; color: #fff; }

/* ── Avatar ───────────────────────────────────────────────────────── */
.avatar-wrap {
  border-radius: 50%;
  padding: 3px;
  margin-bottom: 10px;
}
.avatar-wrap.gold   { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.avatar-wrap.silver { background: linear-gradient(135deg, #94a3b8, #64748b); }
.avatar-wrap.bronze { background: linear-gradient(135deg, #f97316, #ea580c); }

.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  display: block;
}

.podium-center .avatar-img {
  width: 88px;
  height: 88px;
}

/* ── Op name & chip ───────────────────────────────────────────────── */
.op-name {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 6px;
  text-align: center;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.chat-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}
.gold-chip   { background: #fef3c7; color: #b45309; }
.silver-chip { background: #f1f5f9; color: #475569; }
.bronze-chip { background: #fde8d8; color: #c2410c; }

/* ── List rows ────────────────────────────────────────────────────── */
.ops-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.op-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.op-row:hover {
  background: #f0f4ff;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.07);
}

.op-position {
  font-size: 0.8rem;
  font-weight: 800;
  color: #94a3b8;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.op-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #e2e8f0;
}

.op-info {
  flex: 1;
  min-width: 0;
}

.op-list-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-chats {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0d6efd;
  white-space: nowrap;
}

.progress-track {
  height: 5px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #0d6efd, #6ea8fe);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Scrollbar ────────────────────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar       { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
</style>
