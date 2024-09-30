import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

export const store = createStore({
  state: {
    coffeeProductions: [], // Seller가 입력한 데이터를 저장
    confirmedProductions: [],
    shoppingCart: {}
  },
  mutations: {
    // production
    addProduction(state, production) {
      state.coffeeProductions.push(production); // 데이터 추가
    },
    removeProduction(state, index) {
      state.coffeeProductions.splice(index, 1); // 인덱스에 해당하는 데이터를 제거
    },

    // confirmed production
    confirmProduction(state, product) {
      // 기존 상품이 있는지 확인
      const existingProduct = state.confirmedProductions.find(
        item => item.coffeeName === product.coffeeName && item.beanType === product.beanType
      );
    
      if (existingProduct) {
        // 기존 상품이 있으면 수량을 누적
        existingProduct.quantity += product.quantity;
      } else {
        // 기존 상품이 없으면 새로운 상품 추가
        state.confirmedProductions.push(product);
      }
    },
    removeConfirmedProduction(state, product) {
      const index = state.confirmedProductions.findIndex(item =>
        item.coffeeName === product.coffeeName && item.beanType === product.beanType
      );
      if (index !== -1) {
        state.confirmedProductions.splice(index, 1); // 데이터 삭제
      }
    },
    updateConfirmedProductionQuantity(state, { coffeeName, beanType, newQuantity }) {
      console.log('Updating confirmed production quantity:', coffeeName, beanType, newQuantity); // 전달된 값 출력
      const product = state.confirmedProductions.find(
        item => item.coffeeName === coffeeName && item.beanType === beanType
      );
      if (product) {
        console.log('Found product:', product); // 찾은 상품 출력
        product.quantity = newQuantity;
        console.log('Updated product quantity:', product); // 업데이트된 수량 출력
      }
      else {
        console.log('Product not found'); // 상품을 찾지 못한 경우 출력
      }
    },
    clearConfirmedProductions(state) {
      state.confirmedProductions = []; // confirmedProductions 배열 초기화
    },

    // shopping cart
    addShoppingCart(state, { userId, production }) {
      if (!state.shoppingCart[userId]) {
        state.shoppingCart[userId] = [];
      }
      state.shoppingCart[userId].push(production);
    },
    removeShoppingCart(state, { userId, index }) {
      if (state.shoppingCart[userId]) {
        state.shoppingCart[userId].splice(index, 1);
      }
    },
    clearShoppingCart(state, userId) {
      state.shoppingCart[userId] = [];
    },
  },
  actions: {
    addCoffeeProduction({ commit }, production) {
      commit('addProduction', production);
    },
    deleteCoffeeProduction({ commit }, index) {
      commit('removeProduction', index);
    },

    confirmCoffeeProduction({ commit }, product) {
      commit('confirmProduction', product);
    },
    deleteConfirmedProduction({ commit }, product) {
      commit('removeConfirmedProduction', product); // Vuex 상태에서 삭제
    },
    updateConfirmedProductionQuantity({ commit }, payload) {
      commit('updateConfirmedProductionQuantity', payload);
    },
    clearConfirmedProductions({ commit }) {
      commit('clearConfirmedProductions'); // confirmedProductions 배열을 초기화하는 mutation 호출
    },
    
    addCoffeeShoppingCart({ commit }, { userId, production }) {
      commit('addShoppingCart', { userId, production });
    },
    deleteCoffeeShoppingCart({ commit }, { userId, index }) {
      commit('removeShoppingCart', { userId, index });
    },
    clearCoffeeShoppingCart({ commit }, userId) {
      commit('clearShoppingCart', userId);
    },
  },
  getters: {
    getCoffeeProductions: state => {
      return state.coffeeProductions; // 모든 데이터 조회
    },
    getConfirmedProductions: state => {
      return state.confirmedProductions; // 모든 데이터 조회
    },
    getShoppingCart: (state) => (userId) => {
      return state.shoppingCart[userId] || [];
    },
  },
  plugins: [createPersistedState()] // vuex-persistedstate 플러그인 추가
});
