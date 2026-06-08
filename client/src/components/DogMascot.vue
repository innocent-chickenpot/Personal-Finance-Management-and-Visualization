<script setup>
defineProps({
  size: { type: Number, default: 120 },
  pose: { type: String, default: 'sitting', validator: v => ['sitting', 'lying', 'peeking', 'happy', 'waiting'].includes(v) },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 200 200`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="dog-mascot"
    :class="`pose-${pose}`"
  >
    <!-- sitting pose -->
    <template v-if="pose === 'sitting'">
      <!-- tail -->
      <ellipse cx="155" cy="130" rx="18" ry="9" fill="#ECD8C6" transform="rotate(-20 155 130)" />
      <!-- body -->
      <ellipse cx="115" cy="125" rx="55" ry="40" fill="#F5E6D8" />
      <ellipse cx="115" cy="120" rx="42" ry="30" fill="#FDF5EC" />
      <!-- left ear -->
      <ellipse cx="55" cy="55" rx="22" ry="35" fill="#E0C4A8" transform="rotate(15 55 55)" />
      <ellipse cx="58" cy="58" rx="14" ry="24" fill="#E8CBB2" transform="rotate(10 58 58)" />
      <!-- right ear -->
      <ellipse cx="125" cy="50" rx="18" ry="30" fill="#E0C4A8" transform="rotate(-10 125 50)" />
      <ellipse cx="123" cy="53" rx="11" ry="20" fill="#E8CBB2" transform="rotate(-5 123 53)" />
      <!-- head -->
      <circle cx="90" cy="82" r="48" fill="#F5E6D8" />
      <circle cx="90" cy="80" r="44" fill="#FDF5EC" />
      <!-- blush left -->
      <ellipse cx="60" cy="92" rx="14" ry="9" fill="#F2C4C4" opacity="0.5" />
      <!-- blush right -->
      <ellipse cx="112" cy="90" rx="13" ry="8" fill="#F2C4C4" opacity="0.5" />
      <!-- left eye -->
      <circle cx="68" cy="76" r="9" fill="#4A3525" />
      <circle cx="71" cy="73" r="3.5" fill="white" />
      <circle cx="65" cy="78" r="2" fill="white" />
      <!-- right eye -->
      <circle cx="104" cy="74" r="8.5" fill="#4A3525" />
      <circle cx="107" cy="71" r="3" fill="white" />
      <circle cx="101" cy="76" r="2" fill="white" />
      <!-- nose -->
      <ellipse cx="86" cy="92" rx="7" ry="5.5" fill="#6B5D48" />
      <ellipse cx="85" cy="90" rx="2.5" ry="1.5" fill="#8B7B68" />
      <!-- mouth -->
      <path d="M80 99 Q86 105 92 99" stroke="#8B7B68" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <!-- paws -->
      <ellipse cx="88" cy="152" rx="16" ry="10" fill="#F0DDCC" />
      <ellipse cx="140" cy="150" rx="16" ry="10" fill="#F0DDCC" />
    </template>

    <!-- lying pose (relaxed) -->
    <template v-if="pose === 'lying'">
      <!-- body stretched -->
      <ellipse cx="90" cy="130" rx="70" ry="32" fill="#F5E6D8" />
      <ellipse cx="90" cy="126" rx="58" ry="24" fill="#FDF5EC" />
      <!-- left ear -->
      <ellipse cx="52" cy="68" rx="18" ry="28" fill="#E0C4A8" transform="rotate(20 52 68)" />
      <ellipse cx="54" cy="70" rx="11" ry="19" fill="#E8CBB2" transform="rotate(12 54 70)" />
      <!-- right ear -->
      <ellipse cx="120" cy="64" rx="16" ry="25" fill="#E0C4A8" transform="rotate(-15 120 64)" />
      <ellipse cx="118" cy="66" rx="10" ry="17" fill="#E8CBB2" transform="rotate(-8 118 66)" />
      <!-- head on ground -->
      <ellipse cx="82" cy="100" rx="36" ry="30" fill="#F5E6D8" />
      <ellipse cx="82" cy="98" rx="33" ry="27" fill="#FDF5EC" />
      <!-- closed eyes (^ ^) -->
      <path d="M62 90 Q68 84 74 90" stroke="#4A3525" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M90 88 Q96 82 102 88" stroke="#4A3525" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <!-- nose -->
      <ellipse cx="78" cy="102" rx="5" ry="4" fill="#6B5D48" />
      <!-- mouth -->
      <path d="M74 108 Q78 112 82 108" stroke="#8B7B68" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <!-- front paws stretched -->
      <ellipse cx="44" cy="138" rx="12" ry="8" fill="#F0DDCC" />
      <ellipse cx="140" cy="136" rx="12" ry="8" fill="#F0DDCC" />
      <!-- zzz -->
      <text x="140" y="55" font-size="14" fill="#A89880" font-family="sans-serif" font-style="italic">z</text>
      <text x="152" y="42" font-size="18" fill="#B8A898" font-family="sans-serif" font-style="italic">z</text>
      <text x="168" y="26" font-size="22" fill="#C8B8A8" font-family="sans-serif" font-style="italic">z</text>
    </template>

    <!-- peeking pose (curious, from behind) -->
    <template v-if="pose === 'peeking'">
      <!-- body peeking from bottom -->
      <ellipse cx="100" cy="160" rx="55" ry="25" fill="#F5E6D8" />
      <!-- paws gripping -->
      <circle cx="68" cy="145" r="12" fill="#F0DDCC" />
      <circle cx="132" cy="145" r="12" fill="#F0DDCC" />
      <circle cx="64" cy="147" r="6" fill="#E8D0BA" />
      <circle cx="128" cy="147" r="6" fill="#E8D0BA" />
      <circle cx="136" cy="147" r="6" fill="#E8D0BA" />
      <!-- ears perked -->
      <ellipse cx="64" cy="48" rx="16" ry="28" fill="#E0C4A8" transform="rotate(25 64 48)" />
      <ellipse cx="66" cy="50" rx="10" ry="19" fill="#E8CBB2" transform="rotate(18 66 50)" />
      <ellipse cx="136" cy="48" rx="16" ry="28" fill="#E0C4A8" transform="rotate(-25 136 48)" />
      <ellipse cx="134" cy="50" rx="10" ry="19" fill="#E8CBB2" transform="rotate(-18 134 50)" />
      <!-- head -->
      <circle cx="100" cy="78" r="45" fill="#F5E6D8" />
      <circle cx="100" cy="76" r="41" fill="#FDF5EC" />
      <!-- wide curious eyes -->
      <circle cx="76" cy="72" r="11" fill="#4A3525" />
      <circle cx="80" cy="68" r="4.5" fill="white" />
      <circle cx="72" cy="75" r="2.5" fill="white" />
      <circle cx="124" cy="72" r="11" fill="#4A3525" />
      <circle cx="128" cy="68" r="4.5" fill="white" />
      <circle cx="120" cy="75" r="2.5" fill="white" />
      <!-- sparkle near eye -->
      <text x="136" y="64" font-size="14" fill="#F7D6D6">✨</text>
      <!-- nose -->
      <ellipse cx="100" cy="90" rx="6" ry="5" fill="#6B5D48" />
      <!-- open mouth (surprised) -->
      <ellipse cx="100" cy="100" rx="8" ry="6" fill="#8B7B68" />
      <ellipse cx="100" cy="98" rx="6" ry="3" fill="#E8B4B4" />
    </template>

    <!-- happy pose (celebratory, jar complete) -->
    <template v-if="pose === 'happy'">
      <!-- body -->
      <ellipse cx="100" cy="130" rx="50" ry="36" fill="#F5E6D8" />
      <ellipse cx="100" cy="126" rx="38" ry="26" fill="#FDF5EC" />
      <!-- left ear (perked up) -->
      <ellipse cx="58" cy="55" rx="18" ry="30" fill="#E0C4A8" transform="rotate(20 58 55)" />
      <ellipse cx="60" cy="57" rx="11" ry="20" fill="#E8CBB2" transform="rotate(14 60 57)" />
      <!-- right ear (perked up) -->
      <ellipse cx="142" cy="55" rx="18" ry="30" fill="#E0C4A8" transform="rotate(-20 142 55)" />
      <ellipse cx="140" cy="57" rx="11" ry="20" fill="#E8CBB2" transform="rotate(-14 140 57)" />
      <!-- head -->
      <circle cx="100" cy="78" r="46" fill="#F5E6D8" />
      <circle cx="100" cy="76" r="42" fill="#FDF5EC" />
      <!-- blush -->
      <ellipse cx="68" cy="88" rx="14" ry="9" fill="#F2C4C4" opacity="0.5" />
      <ellipse cx="132" cy="88" rx="14" ry="9" fill="#F2C4C4" opacity="0.5" />
      <!-- happy eyes (curved ^_^) -->
      <path d="M68 72 Q76 64 84 72" stroke="#4A3525" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M116 72 Q124 64 132 72" stroke="#4A3525" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- nose -->
      <ellipse cx="100" cy="88" rx="7" ry="5.5" fill="#6B5D48" />
      <ellipse cx="99" cy="86" rx="2.5" ry="1.5" fill="#8B7B68" />
      <!-- big happy smile -->
      <path d="M88 96 Q100 112 112 96" stroke="#8B7B68" stroke-width="2.2" fill="none" stroke-linecap="round" />
      <path d="M88 96 Q100 116 112 96" fill="#F2C4C4" opacity="0.3" />
      <!-- raised paws (cheering) -->
      <ellipse cx="58" cy="135" rx="14" ry="9" fill="#F0DDCC" transform="rotate(-20 58 135)" />
      <ellipse cx="142" cy="135" rx="14" ry="9" fill="#F0DDCC" transform="rotate(20 142 135)" />
      <!-- confetti -->
      <circle cx="40" cy="40" r="3" fill="#F7D6D6" />
      <circle cx="160" cy="35" r="2.5" fill="#F7E8B0" />
      <circle cx="30" cy="70" r="2" fill="#D8E7F5" />
      <circle cx="170" cy="65" r="3" fill="#DDE8CF" />
    </template>

    <!-- waiting pose (patient, for placeholder) -->
    <template v-if="pose === 'waiting'">
      <!-- body sitting -->
      <ellipse cx="100" cy="130" rx="48" ry="38" fill="#F5E6D8" />
      <ellipse cx="100" cy="126" rx="36" ry="28" fill="#FDF5EC" />
      <!-- left ear droopy -->
      <ellipse cx="62" cy="60" rx="20" ry="32" fill="#E0C4A8" transform="rotate(12 62 60)" />
      <ellipse cx="64" cy="62" rx="13" ry="22" fill="#E8CBB2" transform="rotate(8 64 62)" />
      <!-- right ear droopy -->
      <ellipse cx="138" cy="60" rx="20" ry="32" fill="#E0C4A8" transform="rotate(-12 138 60)" />
      <ellipse cx="136" cy="62" rx="13" ry="22" fill="#E8CBB2" transform="rotate(-8 136 62)" />
      <!-- head slightly tilted -->
      <circle cx="100" cy="82" r="44" fill="#F5E6D8" />
      <circle cx="100" cy="80" r="40" fill="#FDF5EC" />
      <!-- gentle eyes (open, soft) -->
      <circle cx="76" cy="76" r="8" fill="#4A3525" />
      <circle cx="78" cy="74" r="3" fill="white" />
      <circle cx="73" cy="78" r="1.8" fill="white" />
      <circle cx="124" cy="76" r="8" fill="#4A3525" />
      <circle cx="126" cy="74" r="3" fill="white" />
      <circle cx="121" cy="78" r="1.8" fill="white" />
      <!-- nose -->
      <ellipse cx="100" cy="90" rx="6" ry="5" fill="#6B5D48" />
      <ellipse cx="99" cy="88" rx="2" ry="1.5" fill="#8B7B68" />
      <!-- gentle smile -->
      <path d="M92 97 Q100 104 108 97" stroke="#8B7B68" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <!-- paws -->
      <ellipse cx="72" cy="155" rx="14" ry="9" fill="#F0DDCC" />
      <ellipse cx="128" cy="155" rx="14" ry="9" fill="#F0DDCC" />
      <!-- small paw wave (one raised) -->
      <ellipse cx="68" cy="128" rx="10" ry="7" fill="#F0DDCC" transform="rotate(-30 68 128)" />
    </template>
  </svg>
</template>

<style scoped>
.dog-mascot {
  display: block;
  filter: drop-shadow(0 2px 8px rgba(139, 107, 82, 0.12));
  transition: transform var(--duration-normal) var(--ease-gentle);
  user-select: none;
  pointer-events: none;
}

.dog-mascot:hover {
  transform: scale(1.06);
}

@media (prefers-reduced-motion: reduce) {
  .dog-mascot {
    transition: none;
  }
  .dog-mascot:hover {
    transform: none;
  }
}
</style>
