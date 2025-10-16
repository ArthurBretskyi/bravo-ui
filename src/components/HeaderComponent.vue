<template>
    <header ref="headerRef" class="header">
        <div class="logo">Bravo</div>


        <!-- Навігація (десктоп) -->
        <nav class="nav-menu desktop-only">
            <router-link :to="{ name: 'Home' }">{{ t('home') }}</router-link>
            <!-- <router-link :to="{ name: 'about' }">{{ t('about') }}</router-link> -->
            <router-link :to="{ name: 'Contacts' }">{{ $t('pages.home.contacts') }}</router-link>
            <router-link :to="{ name: 'Reviews' }">{{ $t('reviews') }}</router-link>

            <router-link v-if="!user" :to="{ name: 'Register' }">
                {{ t('auth') }} / {{ t('login') }}
            </router-link>
            <router-link v-if="isAdmin" :to="{ name: 'Admin' }" class="nav-link">
                {{ $t('pages.admin.title') }}
            </router-link>
        </nav>

        <!--  Перемикач мови + Юзер -->
        <div class="right-section desktop-only">
            <div ref="langSwitcherRef" class="lang-switcher">
                <img :src="flagSrc" :key="flagSrc" class="flag"
                    :alt="locale.value === 'uk' ? 'Switch to English' : 'Переключити на українську'"
                    @click="switchLanguage" />
            </div>

            <div v-if="user" ref="userDropdownRef" class="user-dropdown" @click="toggleDropdown">
                <div class="user-main">
                    <img v-if="user.photoURL" :src="user.photoURL" alt="User avatar" class="avatar" />
                    <div v-else class="initials">{{ getInitials(user.displayName || user.email) }}</div>
                    <div class="envelope-wrapper" v-if="user.role === 'master' && todaysAppointmentsCount > 0">
                        <font-awesome-icon icon="fa-solid fa-envelope" />
                        <span class="badge">{{ todaysAppointmentsCount }}</span>
                    </div>
                </div>
                <div v-if="showDropdown" class="dropdown">
                    <p class="dropdown-email">{{ user.email }}</p>
                    <router-link class="dropdown-link"
                        :to="{ name: user.role === 'master' ? 'MasterDashboard' : 'UserDashboard' }">{{
                            $t('userDashboard') }}</router-link>
                    <button @click.stop="handleLogout" class="logout-btn">{{ t('logout') }}</button>

                </div>
            </div>
        </div>


        <!-- Бургер-іконка з FontAwesome -->
        <div ref="burgerRef" class="burger" @click="toggleMobileMenu">
            <font-awesome-icon icon="fa-solid fa-bars" size="lg" style="color: white;" />
        </div>

        <!-- MobileMenu.vue -->
        <MobileMenu v-if="isMobileMenuOpen" :user="user" :flag-src="flagSrc" :t="t"
            :todays-appointments-count="todaysAppointmentsCount" @close="closeMobileMenu" @logout="handleLogout"
            @switch-lang="switchLanguage" @menu-mounted="handleMenuMounted" />

        <!-- бекдроп -->
        <div v-if="isMobileMenuOpen" class="backdrop" @click="closeMobileMenu" />
    </header>
</template>
  
  
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ukFlag from '@/assets/flags/uk.svg'
import gbFlag from '@/assets/flags/gb.svg'
import { useLocales } from '@/modulesHelpers/i18n'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useAppointmentsStore } from '@/stores/appointments'
import gsap from 'gsap'

import MobileMenu from "@/components/MobileMenu.vue"




const { locale, t, setLocale, checkLocale } = useLocales()


const headerRef = ref(null)

// 🇬🇧 Перемикач мови
const flagSrc = computed(() => (locale.value === 'uk' ? gbFlag : ukFlag))
function switchLanguage() {
    const newLang = locale.value === 'uk' ? 'en' : 'uk'
    setLocale(newLang)
}

// dropdown toggle
const showDropdown = ref(false)
function toggleDropdown() {
    showDropdown.value = !showDropdown.value
}

const userDropdownRef = ref(null)

// initials обробник
function getInitials(value) {
    if (!value) return ''

    // Якщо передано email
    if (value.includes('@')) {
        const namePart = value.split('@')[0] // -> "ivan.petrenko"
        const nameWords = namePart.split(/[\s._-]+/) // розбиває по пробілу, крапці, підкресленню, дефісу

        const first = nameWords[0]?.[0] || ''
        const second = nameWords[1]?.[0] || ''

        return (first + second).toUpperCase()
    }

    // Якщо передано ім'я
    const parts = value.trim().split(' ')
    const first = parts[0]?.[0] || ''
    const second = parts[1]?.[0] || ''

    return (first + second).toUpperCase()
}


const isMobileMenuOpen = ref(false)


const mobileMenuRef = ref(null)
const burgerRef = ref(null)
const langSwitcherRef = ref(null)
const logoutRef = ref(null)

function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
    isMobileMenuOpen.value = false
}

// Закриття при кліку поза меню
function handleClickOutside(e) {
    const path = e.composedPath?.() || []

    // Закриття мобільного меню
    if (
        isMobileMenuOpen.value &&
        !path.includes(mobileMenuRef.value) &&
        !path.includes(burgerRef.value) &&
        !path.includes(langSwitcherRef.value) &&
        !path.includes(logoutRef.value)
    ) {
        isMobileMenuOpen.value = false
    }

    // Закриття дропдауну користувача
    if (
        showDropdown.value &&
        !path.includes(userDropdownRef.value)
    ) {
        showDropdown.value = false
    }
}

function handleMenuMounted(el) {
    if (!el) return

    // Розпізнаємо елемент по класу й записуємо у відповідний ref
    if (el.classList.contains('mobile-menu')) {
        mobileMenuRef.value = el
    } else if (el.classList.contains('lang-switcher')) {
        langSwitcherRef.value = el
    } else if (el.classList.contains('logout-mobile')) {
        logoutRef.value = el
    }
}


// Закриття при ресайзі
function handleResize() {
    if (window.innerWidth > 768) {
        closeMobileMenu()
    }
}

// 🟢 Store для записів
const appointmentsStore = useAppointmentsStore()

// 🟢 Кількість записів на сьогодні
const todaysAppointmentsCount = ref(0)
let unsubscribeAppointments = null

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', handleResize)

    gsap.from(headerRef.value, {
        opacity: 0,
        duration: 2.5,
        ease: 'power2.out'
    })

    // 🟢 Реальна підписка
    if (user.value?.role === 'master') {
        const now = new Date()
        unsubscribeAppointments = appointmentsStore.subscribeToMasterUserAppointmentsToday(
            user.value.uid,
            {
                year: now.getFullYear(),
                month: now.getMonth(),
                day: now.getDate()
            },
            (appointments) => {
                todaysAppointmentsCount.value = appointments.length
            }
        )
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', handleResize)

    if (unsubscribeAppointments) {
        unsubscribeAppointments() // 🛑 відписуємось від Firestore
    }
})




// 📦 Авторизація через store
const authStore = useAuthStore()
const isAdmin = authStore.isAdmin
const usersStore = useUsersStore()

const user = computed(() => authStore.getUser())



// 🔐 Обробник логіну
function handleLogin() {
    authStore.loginWithGoogleAccount()
}

// 🚪 Вихід
function handleLogout() {
    authStore.logout()
}

</script>
  
<style lang="scss" scoped >
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 20;
    overflow: visible;

    .logo {
        font-size: 32px;
        font-weight: bold;
    }

    .burger {
        display: none;
        flex-direction: column;
        gap: 5px;
        cursor: pointer;

        span {
            width: 25px;
            height: 3px;
            background: #fff;
            border-radius: 3px;
            transition: all 0.3s;
        }

        span.open:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }

        span.open:nth-child(2) {
            opacity: 0;
        }

        span.open:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -7px);
        }
    }

    .nav-menu {
        display: flex;
        gap: 1.5rem;

        a {
            position: relative;
            text-decoration: none;
            color: #fff;
            font-weight: 500;
            padding-bottom: 4px;
            transition: color 0.3s ease;

            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0%;
                height: 2px;
                background-color: #00CEC8;
                transition: width 0.3s ease;
            }

            &:hover {
                color: #fff;

                &::after {
                    width: 100%;
                }
            }
        }
    }


    .right-section {
        display: flex;
        align-items: center;
        gap: 1rem;

        // 🔲 Напівпрозорий фон
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        padding: 0.4rem 0.8rem;
        border-radius: 10px;

        .flag {
            width: 28px;
            height: 20px;
            cursor: pointer;
            border-radius: 4px;
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.1);
            }
        }

        .user-dropdown {
            position: relative;

            .user-main {
                display: flex;
                align-items: center;
                gap: .5rem;
            }

            .avatar,
            .initials {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                // border: 1px solid white;
                box-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
            }

            .initials {
                background-color: #555;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #fff;
                font-size: 0.85rem;
            }

            .envelope-wrapper {
                position: relative;
                display: inline-block;
                margin-left: 10px;
                cursor: pointer;

                .badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: red;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 12px;
                    font-weight: bold;
                    line-height: 1;
                }
            }


            .dropdown {
                position: absolute;
                top: 55px;
                right: 0;
                background-color: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.4);
                padding: 1rem;
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

                display: flex;
                flex-direction: column;
                gap: 1rem;
                align-items: center;
                justify-content: center;

                .dropdown-email {
                    font-size: 1rem;
                    color: #333;
                }

                .dropdown-link {
                    color: #333;
                    text-decoration: none;
                    font-weight: bold;
                    padding: 0.5rem 1.5rem;
                    border: 2px solid #00CEC8;
                    border-radius: 30px;
                    transition: background-color 0.3s, color 0.3s;

                    &:hover {
                        background-color: #00CEC8;
                        color: #fff;
                        border: 2px solid #00CEC8;

                    }

                }

                .logout-btn {
                    background: transparent;
                    border: none;
                    color: #d9534f;
                    font-weight: bold;
                    cursor: pointer;

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }
        }
    }



    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1000;
        backdrop-filter: blur(2px);
        animation: fadeIn 0.3s ease;
    }

    // Плавна поява бекдропа
    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }



    // Аватар та ініціали
    .avatar,
    .initials {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;

    }

    .initials {
        background-color: #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
        font-size: 0.85rem;

    }

    .dropdown {
        position: absolute;
        top: 45px;
        right: 0;
        background-color: white;
        border: 1px solid #ddd;
        padding: 0.5rem;
        border-radius: 8px;
        z-index: 10;
    }

    .flag {
        width: 28px;
        height: 20px;
        cursor: pointer;
    }

    // Responsive
    @media (max-width: 768px) {
        .burger {
            display: flex;
        }

        .desktop-only {
            display: none;
        }
    }
}
</style>
  