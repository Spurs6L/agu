const { createApp, computed, onBeforeUnmount, onMounted, reactive, ref } = Vue

createApp({
  setup() {
    // 奖品池：rate 用于概率抽取，theme/badge/level 用于活动页视觉展示。
    const prizeList = [
      {
        id: 1,
        name: '粉兔公仔',
        icon: 'https://img.icons8.com/color/96/teddy-bear.png',
        desc: '软萌限定公仔 1 只',
        rate: 0.12,
        level: '超人气',
        badge: 'NEW',
        theme: 'pink'
      },
      {
        id: 2,
        name: '星星发箍',
        icon: 'https://img.icons8.com/color/96/crown.png',
        desc: 'blingbling 可爱发箍',
        rate: 0.13,
        level: '甜妹必备',
        badge: 'HOT',
        theme: 'gold'
      },
      {
        id: 3,
        name: '草莓抱枕',
        icon: 'https://img.icons8.com/color/96/strawberry.png',
        desc: '草莓软抱枕 1 个',
        rate: 0.09,
        level: '限定款',
        badge: 'SSR',
        theme: 'red'
      },
      {
        id: 4,
        name: '奶油手机链',
        icon: 'https://img.icons8.com/color/96/charm.png',
        desc: '手作奶油风手机链',
        rate: 0.1,
        level: '手作感',
        badge: 'PICK',
        theme: 'purple'
      },
      {
        id: 5,
        name: '扭蛋优惠券',
        icon: 'https://img.icons8.com/color/96/discount--v1.png',
        desc: '满 39 减 10 优惠券',
        rate: 0.14,
        level: '必中气氛组',
        badge: '福利',
        theme: 'blue'
      },
      {
        id: 6,
        name: '彩虹徽章',
        icon: 'https://img.icons8.com/color/96/rainbow.png',
        desc: '限定徽章盲盒 1 枚',
        rate: 0.12,
        level: '缤纷限定',
        badge: 'GIFT',
        theme: 'rainbow'
      },
      {
        id: 7,
        name: '爱心糖果盒',
        icon: 'https://img.icons8.com/color/96/macaron.png',
        desc: '甜甜糖果惊喜盒',
        rate: 0.08,
        level: '隐藏奖励',
        badge: 'LUCKY',
        theme: 'mint'
      },
      {
        id: 8,
        name: '幸运空签',
        icon: 'https://img.icons8.com/color/96/sad.png',
        desc: '本次未抓到娃娃，下次更幸运',
        rate: 0.22,
        level: '再来一次',
        badge: 'MISS',
        theme: 'gray'
      }
    ]

    const state = reactive({
      chances: 5,
      drawing: false,
      showPrizeModal: false,
      showRuleModal: false,
      showResultModal: false,
      showMyPrizeModal: false,
      result: null,
      machineGlow: false,
      activePrizeId: null,
      winners: [
        { name: '桃桃', prize: '粉兔公仔' },
        { name: '小莓', prize: '扭蛋优惠券' },
        { name: '云朵', prize: '彩虹徽章' },
        { name: '可颂', prize: '草莓抱枕' },
        { name: '奶盖', prize: '星星发箍' },
        { name: '糯米', prize: '爱心糖果盒' },
        { name: '团子', prize: '奶油手机链' }
      ]
    })

    const myPrizes = ref([
      {
        id: 'seed-1',
        name: '扭蛋优惠券',
        icon: 'https://img.icons8.com/color/96/discount--v1.png',
        status: '已到账',
        time: '今天 18:26',
        type: 'coupon'
      }
    ])

    // 统一控制小球待机/抽奖时的摇晃速度与无序程度。
    const shakeControl = reactive({
      idleSpeed: 1,
      drawSpeed: 4.4,
      drawChaos: 3
    })

    const rules = [
      '每次点击“抓一只”将消耗 1 次抽奖机会。',
      '奖品包含公仔、配饰、优惠券以及惊喜空签。',
      '抽奖结果随机生成，中奖后会加入“我的奖品”。',
      '同一用户每日默认获得 5 次抓娃娃机会。',
      '页面中的名单与奖品图仅作活动演示展示。'
    ]

    const sampleNames = ['丸子', '啵啵', '月芽', '米露', '糖豆', '布丁', '悠悠']
    const randomBetween = (min, max) => Math.random() * (max - min) + min
    const toFixed = (value) => Number(value.toFixed(2))

    // 为每颗球生成一套独立运动参数，避免出现“整齐同步摆动”的机械感。
    const createBallMotionProfile = () => ({
      phaseX: randomBetween(0, Math.PI * 2),
      phaseY: randomBetween(0, Math.PI * 2),
      phaseRotate: randomBetween(0, Math.PI * 2),
      speedX: randomBetween(0.8, 1.4),
      speedY: randomBetween(1.1, 1.9),
      speedRotate: randomBetween(1.1, 1.8),
      speedChaos: randomBetween(3.2, 6.6),
      driftX: randomBetween(0.22, 0.48),
      driftY: randomBetween(0.26, 0.58),
      idleAmpX: randomBetween(8, 18),
      idleAmpY: randomBetween(8, 16),
      idleRotate: randomBetween(4, 10),
      rollAmpX: randomBetween(24, 46),
      rollAmpY: randomBetween(26, 50),
      rollRotate: randomBetween(18, 34),
      rollDrift: randomBetween(0.5, 1.1),
      chaosX: randomBetween(10, 24),
      chaosY: randomBetween(12, 26),
      chaosRotate: randomBetween(6, 14)
    })

    const floatingBalls = ref(
      Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        left: `${10 + index * 8}%`,
        size: `${56 + (index % 3) * 10}px`,
        hue: `${index * 34}deg`,
        offsetX: 0,
        offsetY: 0,
        rotate: 0,
        motion: createBallMotionProfile()
      }))
    )

    const winnerLoop = computed(() => [...state.winners, ...state.winners])
    const marqueeList = computed(() => [...prizeList, ...prizeList])
    const featuredPrizes = computed(() =>
      prizeList.filter((item) => item.name !== '幸运空签').slice(0, 4)
    )
    const myPrizeCount = computed(() => myPrizes.value.length)

    let glowTimer = null
    let audioContext = null
    let animationFrameId = null
    let animationStart = 0

    const playTone = (
      frequency,
      duration,
      type = 'sine',
      volume = 0.04,
      delay = 0
    ) => {
      try {
        audioContext =
          audioContext ||
          new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        const startTime = audioContext.currentTime + delay
        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, startTime)
        gain.gain.setValueAtTime(0.0001, startTime)
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        oscillator.start(startTime)
        oscillator.stop(startTime + duration + 0.02)
      } catch (error) {
        console.warn('audio unavailable', error)
      }
    }

    const playButtonSound = () => {
      playTone(523.25, 0.12, 'triangle', 0.035)
      playTone(659.25, 0.16, 'triangle', 0.03, 0.05)
    }

    const playWinSound = () => {
      playTone(659.25, 0.16, 'triangle', 0.045)
      playTone(783.99, 0.18, 'triangle', 0.04, 0.08)
      playTone(1046.5, 0.24, 'sine', 0.05, 0.16)
    }

    const playMissSound = () => {
      playTone(392, 0.12, 'sine', 0.03)
      playTone(329.63, 0.22, 'sine', 0.028, 0.09)
    }

    const playMachineSound = () => {
      playTone(440, 0.12, 'square', 0.018)
      playTone(392, 0.12, 'square', 0.016, 0.12)
      playTone(523.25, 0.18, 'triangle', 0.024, 0.26)
    }

    const resetBallProfiles = () => {
      floatingBalls.value = floatingBalls.value.map((ball) => ({
        ...ball,
        motion: createBallMotionProfile()
      }))
    }

    // 逐帧更新每颗球的位置与旋转，让轨迹更像被持续摇晃时的自然漂移。
    const updateBallMotion = (now) => {
      if (!animationStart) animationStart = now
      const t = (now - animationStart) / 1000
      const speedFactor = state.drawing
        ? shakeControl.drawSpeed
        : shakeControl.idleSpeed
      const motionTime = t * speedFactor
      const drawingBoost = state.drawing ? 1 : 0
      const chaosFactor = state.drawing ? shakeControl.drawChaos : 0

      floatingBalls.value.forEach((ball, index) => {
        const motion = ball.motion
        const intensity = state.drawing ? 1 : 0
        const ampX =
          motion.idleAmpX + (motion.rollAmpX - motion.idleAmpX) * intensity
        const ampY =
          motion.idleAmpY + (motion.rollAmpY - motion.idleAmpY) * intensity
        const rotateAmp =
          motion.idleRotate +
          (motion.rollRotate - motion.idleRotate) * intensity
        const driftScale = motion.driftX + motion.rollDrift * drawingBoost
        const swayX =
          Math.sin(motionTime * motion.speedX + motion.phaseX) * ampX +
          Math.sin(
            motionTime * (motion.speedX * 0.47 + motion.driftX) + index
          ) *
            ampX *
            0.42
        const swayY =
          Math.cos(motionTime * motion.speedY + motion.phaseY) * ampY +
          Math.sin(
            motionTime * (motion.speedY * 0.58 + motion.driftY) + index * 0.7
          ) *
            ampY *
            0.36
        const rotate =
          Math.sin(motionTime * motion.speedRotate + motion.phaseRotate) *
            rotateAmp +
          Math.cos(
            motionTime * (motion.speedRotate * 0.52 + driftScale) + index
          ) *
            rotateAmp *
            0.32
        // 抽奖时额外叠加高频扰动，模拟箱体被快速晃动时的小范围乱窜。
        const chaosX =
          chaosFactor *
          (Math.sin(
            motionTime * motion.speedChaos + motion.phaseY * 1.3 + index
          ) *
            motion.chaosX +
            Math.cos(motionTime * (motion.speedChaos * 1.7) + motion.phaseX) *
              motion.chaosX *
              0.55)
        const chaosY =
          chaosFactor *
          (Math.cos(
            motionTime * (motion.speedChaos * 1.2) + motion.phaseX * 0.8 + index
          ) *
            motion.chaosY +
            Math.sin(
              motionTime * (motion.speedChaos * 1.9) + motion.phaseRotate
            ) *
              motion.chaosY *
              0.45)
        const chaosRotate =
          chaosFactor *
          Math.sin(
            motionTime * (motion.speedChaos * 1.4) +
              motion.phaseRotate +
              index * 0.6
          ) *
          motion.chaosRotate

        ball.offsetX = toFixed(swayX + chaosX)
        ball.offsetY = toFixed(swayY + chaosY)
        ball.rotate = toFixed(rotate + chaosRotate)
      })

      animationFrameId = window.requestAnimationFrame(updateBallMotion)
    }

    const resetGlow = () => {
      state.machineGlow = true
      window.clearTimeout(glowTimer)
      glowTimer = window.setTimeout(() => {
        state.machineGlow = false
      }, 1800)
    }

    // 按累计概率从奖池中命中一个结果。
    const pickPrize = () => {
      const random = Math.random()
      let cursor = 0
      return (
        prizeList.find((prize) => ((cursor += prize.rate), random <= cursor)) ||
        prizeList[prizeList.length - 1]
      )
    }

    // 非空签结果会进入“我的奖品”，便于后续扩展成真实领奖记录。
    const addPrizeRecord = (prize) => {
      myPrizes.value.unshift({
        id: `${prize.id}-${Date.now()}`,
        name: prize.name,
        icon: prize.icon,
        status: prize.name.includes('券') ? '已到账' : '待发货',
        time: new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: prize.name.includes('券') ? 'coupon' : 'gift'
      })
    }

    // 抽奖主流程：扣次数、触发摇晃与高亮、延时揭晓结果，再更新中奖记录。
    const drawPrize = () => {
      if (state.drawing) {
        vant.showToast('娃娃机正在抓取中')
        return
      }
      if (state.chances <= 0) {
        vant.showToast('今日机会已用完')
        return
      }

      playButtonSound()
      state.chances -= 1
      state.drawing = true
      state.result = null
      state.activePrizeId = null
      resetGlow()
      playMachineSound()
      resetBallProfiles()

      const targetPrize = pickPrize()
      const flashList = prizeList.filter((item) => item.name !== '幸运空签')
      let index = 0

      // 抽奖中的高亮轮播只用于制造“正在抓取”的反馈，不影响最终概率结果。
      const flashTimer = window.setInterval(() => {
        state.activePrizeId = flashList[index % flashList.length].id
        index += 1
      }, 140)

      window.setTimeout(() => {
        window.clearInterval(flashTimer)
        state.activePrizeId =
          targetPrize.name === '幸运空签' ? null : targetPrize.id
        state.result = targetPrize
        state.drawing = false
        state.showResultModal = true
        resetBallProfiles()

        if (targetPrize.name === '幸运空签') {
          playMissSound()
        } else {
          playWinSound()
          addPrizeRecord(targetPrize)
          state.winners.unshift({
            name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
            prize: targetPrize.name
          })
          state.winners = state.winners.slice(0, 8)
        }
      }, 2400)
    }

    const closeResult = () => {
      state.showResultModal = false
    }

    onMounted(() => {
      resetGlow()
      resetBallProfiles()
      animationFrameId = window.requestAnimationFrame(updateBallMotion)
    })

    onBeforeUnmount(() => {
      window.clearTimeout(glowTimer)
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId)
    })

    return {
      closeResult,
      drawPrize,
      featuredPrizes,
      floatingBalls,
      marqueeList,
      myPrizeCount,
      myPrizes,
      prizeList,
      rules,
      shakeControl,
      state,
      winnerLoop
    }
  },
  template: `
    <main class="page-shell">
      <div class="sky-decor sky-decor-left"></div>
      <div class="sky-decor sky-decor-right"></div>

      <section class="app">
        <header class="hero">
          <div class="hero-actions">
            <button class="float-action" @click="state.showPrizeModal = true">
              <span class="float-action__icon">🎁</span>
              <span>全部奖品</span>
            </button>
            <button class="float-action peach" @click="state.showMyPrizeModal = true">
              <span class="float-action__icon">👜</span>
              <span>我的奖品</span>
            </button>
            <button class="float-action secondary" @click="state.showRuleModal = true">
              <span class="float-action__icon">📜</span>
              <span>抽奖规则</span>
            </button>
          </div>

          <div class="hero-title-wrap">
            <p class="hero-kicker">Sweet Catch Machine</p>
            <h1 class="hero-title">个人抓娃娃抽奖</h1>
            <p class="hero-subtitle">软萌娃娃机已开启，抓走你的今日好运</p>
          </div>
        </header>

        <section class="prize-marquee">
          <div class="prize-marquee__track">
            <article v-for="(item, index) in marqueeList" :key="'marquee-' + item.id + '-' + index" class="prize-pill">
              <img :src="item.icon" :alt="item.name" />
              <div>
                <h3>{{ item.name }}</h3>
                <p>{{ item.desc }}</p>
              </div>
            </article>
          </div>
        </section>

        <section class="account-strip">
          <div class="account-card">
            <span>我的奖品</span>
            <strong>{{ myPrizeCount }}</strong>
            <small>已收获的可爱战利品</small>
          </div>
          <div class="account-card">
            <span>摇晃速度</span>
            <strong>{{ shakeControl.drawSpeed.toFixed(1) }}</strong>
            <small>可在代码中调整抽奖速度</small>
          </div>
        </section>

        <section class="event-strip">
          <article v-for="item in featuredPrizes" :key="'featured-' + item.id" class="event-prize-card" :class="'theme-' + item.theme">
            <span class="event-prize-card__badge">{{ item.badge }}</span>
            <div class="event-prize-card__media">
              <img :src="item.icon" :alt="item.name" />
            </div>
            <div class="event-prize-card__body">
              <p class="event-prize-card__level">{{ item.level }}</p>
              <h3>{{ item.name }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </section>

        <section class="machine-card" :class="{ glow: state.machineGlow, drawing: state.drawing }">
          <div class="machine-top">
            <div class="machine-badge">Cute Drop</div>
            <div class="machine-label">今日奖池 · 可爱补给站</div>
          </div>

          <div class="machine-body">
            <div class="machine-claw">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="machine-glass">
              <div
                v-for="ball in floatingBalls"
                :key="ball.id"
                class="capsule-ball"
                :class="{ active: state.activePrizeId === ball.id }"
                :style="{
                  left: ball.left,
                  width: ball.size,
                  height: ball.size,
                  filter: 'hue-rotate(' + ball.hue + ')',
                  transform: 'translate3d(' + ball.offsetX + 'px, ' + ball.offsetY + 'px, 0) rotate(' + ball.rotate + 'deg)'
                }"
              ></div>
              <div class="spark spark-1"></div>
              <div class="spark spark-2"></div>
              <div class="spark spark-3"></div>
            </div>
          </div>

          <div class="machine-base">
            <p class="chance-text">剩余 <strong>{{ state.chances }}</strong> 次抓娃娃机会</p>
            <van-button
              class="draw-button draw-button--vant"
              round
              block
              type="danger"
              :disabled="state.drawing || state.chances <= 0"
              @click="drawPrize"
            >
              <span class="draw-button__shine"></span>
              <span v-if="state.drawing">娃娃机抓取中...</span>
              <span v-else-if="state.chances <= 0">机会已用完</span>
              <span v-else>点击抓一只</span>
            </van-button>
            <p class="helper-text">有机会抓到公仔、配饰、优惠券，也可能手滑空抓哦</p>
          </div>
        </section>

        <section class="winner-board">
          <div class="winner-board__head">
            <span>中奖播报</span>
            <small>好运正在滚动派送中</small>
          </div>
          <div class="winner-board__list">
            <div class="winner-board__track">
              <article v-for="(item, index) in winnerLoop" :key="item.name + item.prize + index" class="winner-item">
                <span class="winner-name">{{ item.name }}</span>
                <span class="winner-text">抓到了</span>
                <span class="winner-prize">{{ item.prize }}</span>
              </article>
            </div>
          </div>
        </section>
      </section>

      <!-- Vant Popup 统一承接活动页弹层，后续替换成接口数据时结构也更稳定。 -->
      <van-popup v-model:show="state.showPrizeModal" round position="bottom" class="vant-sheet" :style="{ height: '72vh' }">
        <section class="sheet-body">
          <div class="sheet-head">
            <h2>全部奖品</h2>
            <van-icon name="cross" size="22" @click="state.showPrizeModal = false" />
          </div>
          <div class="prize-grid">
            <article v-for="item in prizeList" :key="item.id" class="prize-card" :class="'theme-' + item.theme">
              <span class="prize-card__badge">{{ item.badge }}</span>
              <img :src="item.icon" :alt="item.name" />
              <h3>{{ item.name }}</h3>
              <van-tag round plain color="#ff6f98" class="prize-card__tag">{{ item.level }}</van-tag>
              <p>{{ item.desc }}</p>
            </article>
          </div>
        </section>
      </van-popup>

      <van-popup v-model:show="state.showRuleModal" round position="bottom" class="vant-sheet" :style="{ height: '58vh' }">
        <section class="sheet-body">
          <div class="sheet-head">
            <h2>抽奖规则</h2>
            <van-icon name="cross" size="22" @click="state.showRuleModal = false" />
          </div>
          <van-cell-group inset class="soft-cell-group">
            <van-cell v-for="(item, index) in rules" :key="item" :title="'规则 ' + (index + 1)" :label="item" />
          </van-cell-group>
        </section>
      </van-popup>

      <van-popup v-model:show="state.showMyPrizeModal" round position="bottom" class="vant-sheet" :style="{ height: '70vh' }">
        <section class="sheet-body">
          <div class="sheet-head">
            <h2>我的奖品</h2>
            <van-icon name="cross" size="22" @click="state.showMyPrizeModal = false" />
          </div>
          <div v-if="myPrizes.length" class="my-prize-list">
            <article v-for="item in myPrizes" :key="item.id" class="my-prize-item">
              <div class="my-prize-item__media">
                <img :src="item.icon" :alt="item.name" />
              </div>
              <div class="my-prize-item__body">
                <div class="my-prize-item__title">
                  <h3>{{ item.name }}</h3>
                  <van-tag round :type="item.type === 'coupon' ? 'success' : 'primary'">{{ item.status }}</van-tag>
                </div>
                <p>{{ item.time }}</p>
              </div>
            </article>
          </div>
          <van-empty v-else description="还没有抓到奖品，快去试试手气吧" />
        </section>
      </van-popup>

      <van-popup v-model:show="state.showResultModal" round class="result-popup">
        <section v-if="state.result" class="result-card" :class="{ empty: state.result.name === '幸运空签' }">
          <div class="gift-reveal">
            <div class="gift-burst"></div>
            <div class="gift-box" :class="{ miss: state.result.name === '幸运空签' }">
              <div class="gift-box__lid">
                <span class="gift-box__ribbon gift-box__ribbon--vertical"></span>
                <span class="gift-box__ribbon gift-box__ribbon--horizontal"></span>
                <span class="gift-box__bow"></span>
              </div>
              <div class="gift-box__base">
                <span class="gift-box__ribbon gift-box__ribbon--vertical"></span>
                <div class="gift-prize">
                  <img :src="state.result.icon" :alt="state.result.name" />
                </div>
              </div>
            </div>
          </div>
          <div class="result-copy">
            <h2>{{ state.result.name === '幸运空签' ? '差一点点就抓到了' : '礼盒开启成功' }}</h2>
            <h3>{{ state.result.name === '幸运空签' ? '这次是幸运空签' : state.result.name }}</h3>
            <p>{{ state.result.desc }}</p>
          </div>
          <van-button round block type="danger" class="confirm-button confirm-button--vant" @click="closeResult">
            收下好运
          </van-button>
        </section>
      </van-popup>
    </main>
  `
})
  .use(vant)
  .mount('#app')
