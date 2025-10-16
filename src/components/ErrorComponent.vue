<template>
    <div class="error-container">
        <div>
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" size="6x" class="icon" />
        </div>
        <div>
            <h2>
                {{ $t('error.messages.smth_wrong') }}
            </h2>
        </div>
    </div>
</template>
  
<style lang="scss" scoped>
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // text-align: center;
}

// .mt-16 {
// margin-top: 16px;
// }

// .ml-16 {
// margin-left: 16px;
// }

// .icon {
//     position: absolute;
//     left: 50%;
//     top: 50%;
//     transform: translate(-50%, -50%);
// }
</style>