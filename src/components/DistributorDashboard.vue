<template>
  <div class="content">
    <figure class="left-video"><img src="../../public/img/coffee-beans.png" alt="Coffee Cup"></figure>
    <div class="right-side">
      <h2>Distributor Dashboard</h2>
      
      <!-- 옵션 선택 박스 -->
      <div class="option-selector">
        <select v-model="selectedOption" id="options">
          <option value="production">Production</option>
          <option value="shipping">Shipping</option>
        </select>
      </div>

      <!-- 선택된 옵션에 따라 다른 화면 표시 -->
      <div id="panel" class="panel-container">
        <h3 v-if="selectedOption === 'production'">Today's Coffee Production</h3>
        <div v-if="selectedOption === 'production'">
          <div v-if="coffeeProductions.length > 0">
            <ul>
              <li v-for="(product, index) in coffeeProductions" :key="index">
                Coffee: {{ product.coffeeName }} - Type: {{ product.beanType }} - Quantity: {{ product.quantity * 100 }}g
                <button class="check-btn" @click="selectProduction(product, index)">✅</button>
                <button class="delete-btn" @click="deleteProduction(index)">❌</button>
              </li>
            </ul>
          </div>
          <div v-else>
            <p>No coffee production data available.</p>
          </div>
          <button class="btn" @click="refreshProduction">Refresh Data</button>
        </div>

        <!-- 배송 정보 입력 화면 -->
        <div v-if="selectedOption === 'shipping'">
          <h3>Enter Shipping Information</h3>
          <form @submit.prevent="submitShippingInfo">
            <div>
              <label for="shippingAddress">Shipping Address:</label>
              <input type="text" id="shippingAddress" v-model="shippingInfo.address" />
            </div>
            <div>
              <label for="deliveryDate">Delivery Date:</label>
              <input type="date" id="deliveryDate" v-model="shippingInfo.date" />
            </div>
            <button type="submit" class="btn">Submit Shipping Info</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedOption: 'production', // 기본값은 생산량 확인
      shippingInfo: {
        address: '',
        date: ''
      }
    };
  },
  computed: {
    coffeeProductions() {
      return this.$store.getters.getCoffeeProductions; // Vuex에서 데이터 조회
    }
  },
  methods: {
    refreshProduction() {
      alert('Refreshing coffee production data...');
      window.location.reload();
    },
    selectProduction(product, index) {
      const productInfo = {
        coffeeName: product.coffeeName,
        beanType: product.beanType,
        quantity: product.quantity
      };
      this.$store.dispatch('confirmCoffeeProduction', productInfo);
      alert(`The stock for ${productInfo.coffeeName}, ${productInfo.beanType}, ${productInfo.quantity * 100}g has been successfully registered.`);
      this.$store.dispatch('deleteCoffeeProduction', index);
    },
    deleteProduction(index) {
      const delconfirmed = confirm('Are you sure you want to delete the product data?');
      if (delconfirmed) {
        this.$store.dispatch('deleteCoffeeProduction', index);
      } else {
        alert('The deletion has been canceled.');
      }
    },
    submitShippingInfo() {
      // 배송 정보 제출 로직
      alert(`Shipping to ${this.shippingInfo.address} on ${this.shippingInfo.date}`);
      this.shippingInfo.address = '';
      this.shippingInfo.date = '';
    }
  }
};
</script>

<style scoped>
/* 스타일은 기본 스타일과 동일 */
h2 {
  font-family: 'Great Vibes', cursive;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 10vh;
  font-size: 2.3em;
}
h3 {
  font-family: 'Times New Roman', Times, serif;
  text-align: center;
  font-size: 1.8em;
  margin-bottom: 20px;
}
.content {
  background: #ffc99f;
}
.right-side {
  background: #C69B7B;
  padding: 20px;
}
.panel-container {
  background-color: white;
  box-shadow: 3px 10px 3px rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  max-width: 480px;
  margin: 10% auto 2% auto;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  font-size: 18px;
  margin: 10px 0;
}
strong {
  font-size: 22px;
}
.panel-container strong {
  line-height: 25px;
}
.btn {
  background-color: gainsboro;
  color: #000;
  border: 0;
  border-radius: 4px;
  padding: 12px 30px;
  cursor: pointer;
  margin-top: 20px;
}
.btn:focus {
  outline: 0;
}
.btn:active {
  transform: scale(0.98);
}
.btn:hover {
  background: rgb(182, 181, 181);
}
img {
  width: 100%;
  filter: drop-shadow(1px 1px 60px white);
}
figure {
  width: 20%;
  position: absolute;
  left: 5%;
  bottom: 25%;
}
.check-btn {
  background-color: #28a745;
  color: white;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
}
.check-btn:hover {
  background-color: #218838;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
}
.delete-btn:hover {
  background-color: #c82333;
}

/* 옵션 선택 박스 스타일 */
.option-selector {
  margin-bottom: 20px;
  float: right;
  margin-right: 160px;
  margin-top: 20px;
}
.option-selector select {
  padding: 5px;
  font-size: 16px;
}
</style>
