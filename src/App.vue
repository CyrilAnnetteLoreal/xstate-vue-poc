<template>
  <div>
    <p>
      <strong>Current route path:</strong> {{ $route.fullPath }}
    </p>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script>

export default {
  name: 'App',
}
</script>

<style></style>