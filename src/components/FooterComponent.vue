<template>
    <footer class="footer">
        <p>&copy; {{ new Date().getFullYear() }} ReStyle. All rights reserved.</p>
    </footer>
</template>
  
<script setup>
</script>
  
<style scoped lang="scss">
.footer {
    text-align: center;
    padding: 1rem 1.5rem;
    font-size: 0.85rem;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(6px);
    box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.2);

    @media (max-width: 600px) {
        font-size: 0.75rem;
        padding: 0.75rem 1rem;
    }
}
</style>
  