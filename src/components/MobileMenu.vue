<template>
    <teleport to="body">
        <div ref="menuRef" class="mobile-menu">
            <div class="mobile-menu__header">
                <!-- 🌍 Перемикач мови -->
                <div class="lang-switcher" @click="$emit('switch-lang')">
                    <img :src="flagSrc" :key="flagSrc" class="flag" />
                </div>
                <!-- Закриття -->
                <button class="close-btn" @click="$emit('close')">
                    <font-awesome-icon icon="fa-solid fa-xmark" size="xl" />
                </button>
            </div>

            <!-- Основна навігація -->
            <router-link :to="{ name: 'Home' }" @click="emitClose">{{ t('home') }}</router-link>
            <!-- <router-link :to="{ name: 'about' }" @click="emitClose">{{ t('about') }}</router-link> -->
            <router-link :to="{ name: 'Contacts' }" @click="emitClose">{{ t('contacts') }}</router-link>
            <router-link :to="{ name: 'Reviews' }" @click="emitClose">{{ $t('reviews') }}</router-link>

            <!-- Авторизація / Профіль -->
            <router-link v-if="!user" :to="{ name: 'Register' }" @click="emitClose">
                {{ t('auth') }} / {{ t('login') }}
            </router-link>

            <!-- Якщо користувач залогінений -->
            <div v-else class="user-section">
                <div class="user-info">
                    <img v-if="user.photoURL" :src="user.photoURL" alt="User avatar" class="avatar" />
                    <div v-else class="initials">{{ getInitials(user.displayName || user.email) }}</div>
                    <p class="email">{{ user.email }}</p>
                </div>

                <!-- 🔔 Сповіщення -->
                <div v-if="user.role === 'master' && todaysAppointmentsCount > 0" class="notifications"
                    @click="goToDashboard">
                    <font-awesome-icon icon="fa-solid fa-envelope" class="envelpe" />
                    <span class="badge">{{ todaysAppointmentsCount }}</span>
                    <!-- <span class="notif-label">{{ $t('notifications') }}</span> -->
                </div>

                <!-- 🧭 Профіль -->
                <router-link :to="{ name: user.role === 'master' ? 'MasterDashboard' : 'UserDashboard' }" @click="emitClose"
                    class="profile-link">
                    {{ $t('userDashboard') }}
                </router-link>

                <!-- 🛠️ Адмін панель -->
                <router-link v-if="user.role === 'admin'" :to="{ name: 'Admin' }" @click="emitClose" class="admin-link">
                    {{ $t('pages.admin.title') }}
                </router-link>
            </div>


            <!-- 🚪 Вихід -->
            <!-- <button class="logout-btn" @click="$emit('logout')">{{ t('logout') }}</button> -->
        </div>
    </teleport>
</template>
  
<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { useRouter } from 'vue-router'

const props = defineProps({
    user: Object,
    flagSrc: String,
    t: Function,
    todaysAppointmentsCount: Number,
})

const emit = defineEmits(['close', 'logout', 'switch-lang', 'menu-mounted'])

const menuRef = ref(null)
const router = useRouter()

function emitClose() {
    gsap.to(menuRef.value, {
        x: '-100%',
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => emit('close'),
    })
}

function getInitials(value) {
    if (!value) return ''
    if (value.includes('@')) {
        const namePart = value.split('@')[0]
        const parts = namePart.split(/[\s._-]+/)
        return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase()
    }
    const parts = value.trim().split(' ')
    return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase()
}

function goToDashboard() {
    if (!props.user) return
    const routeName = props.user.role === 'master' ? 'MasterDashboard' : 'UserDashboard'
    router.push({ name: routeName })
    emitClose()
}

onMounted(() => {
    gsap.fromTo(menuRef.value, { x: '-100%', opacity: 0 }, { x: '0%', opacity: 1, duration: 0.4 })
    emit('menu-mounted', menuRef.value)
})
</script>
  
<style scoped lang="scss">
.mobile-menu {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100%;
    max-width: 80vw;
    background-color: rgba(196, 164, 132, 0.7);
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
    z-index: 1001;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-block-end: .625rem;
    }

    a {
        font-size: 1.6rem;
        font-weight: 500;
        color: #fff;
        text-decoration: none;
    }

    .close-btn {
        align-self: flex-end;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #fff;
    }

    .user-section {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        padding-top: 1.3rem;
        border-top: 1px solid #ddd;

        .user-info {
            display: flex;
            align-items: center;
            gap: 0.6rem;

            .avatar,
            .initials {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #00CEC8;
                color: white;
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }

            .email {
                font-size: 1rem;
                color: #fff;
            }
        }

        .notifications {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.2rem;
            font-size: 1rem;
            color: #fff;
            cursor: pointer;

            .envelpe {
                font-size: 20px;
            }

            .badge {
                background: #FFDA00;
                color: #333;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 12px;
                font-weight: bold;
                line-height: 1;
            }

            // .notif-label {
            //     font-size: 0.85rem;
            //     color: #555;
            // }
        }

        .profile-link {
            font-weight: 600;
            color: #fff;
            border-left: 3px solid #00cec8;
            padding-left: 8px;
        }

        .admin-link {
            font-weight: 600;
            color: #fff;
            border-left: 3px solid #00cec8;
            padding-left: 8px;
        }


    }

    // .logout-btn {
    //     background: transparent;
    //     border: none;
    //     color: #d9534f;
    //     font-weight: bold;
    //     cursor: pointer;
    //     align-self: flex-end;
    //     padding: 0;
    // }

    .lang-switcher {
        display: flex;
        align-items: center;
        justify-content: center;

        .flag {
            width: 38px;
            height: 28px;
            cursor: pointer;
        }
    }
}
</style>
  