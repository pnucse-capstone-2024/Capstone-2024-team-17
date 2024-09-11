<template>
  <div>
    <h1>Distributor Dashboard</h1>
    <div v-if="coffeeProductions.length > 0">
      <h2>Today's Coffee Production</h2>
      <ul>
        <li v-for="(production, index) in coffeeProductions" :key="index">
          Coffee: {{ production.coffeeName }} - Type: {{ production.beanType }} - Quantity: {{ production.quantity }}kg
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No coffee production data available.</p>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    coffeeProductions() {
      console.log(this.$store.getters.getCoffeeProductions);
      return this.$store.getters.getCoffeeProductions; // Vuex에서 데이터 조회
    }
  }
};
</script>
