import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

export const store = createStore({
  state: {
    coffeeProductions: [], // Seller가 입력한 데이터를 저장
    confirmedProductions: [],
    shoppingCart: {},
    orderInfo: {},
    shippingInfos: {},
  },
  mutations: {
    // production
    addProduction(state, production) {
      state.coffeeProductions.push(production); // 데이터 추가
    },
    removeProduction(state, index) {
      state.coffeeProductions.splice(index, 1); // 인덱스에 해당하는 데이터를 제거
    },
    addconfirmProduction(state, { Name, Type, Quantity, TxInfo }) {
      const production = {
        coffeeName: Name,
        beanType: Type,
        quantity: Quantity,
        TxInfo: TxInfo, // Include TxInfo array
      };
      state.confirmedProductions.push(production);
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
    updateConfirmedProduction(state, { coffeeName, beanType, quantity, txInfo }) {
      const product = state.confirmedProductions.find(
        item => item.coffeeName === coffeeName && item.beanType === beanType
      );
      // 새 txInfo 객체
      const sanitizedTxInfo = {
        txHash: txInfo.txHash,
        quantity: Number(txInfo.quantity) * 10,
        timestamp: Number(txInfo.timestamp),
      };
    
      if (product) {
        // 기존 제품 업데이트
        product.quantity = Number(product.quantity) + (Number(quantity) * 10);
        product.TxInfo.push(sanitizedTxInfo);
        // timestamp 기준으로 오름차순 정렬
        product.TxInfo.sort((a, b) => a.timestamp - b.timestamp);
      } else {
        // 제품이 존재하지 않는 경우 새로 생성
        state.confirmedProductions.push({
          coffeeName,
          beanType,
          quantity: Number(quantity) * 10,
          TxInfo: [sanitizedTxInfo],
        });
      }
    },
    updateConfirmedProductionAfterOrder(state, { coffeeName, beanType, newQuantity, newTxInfo }) {
      const product = state.confirmedProductions.find(
        item => item.coffeeName === coffeeName && item.beanType === beanType
      );
      if (product) {
        product.quantity = Number(newQuantity);
        // Ensure all txInfo entries have Numbers or Strings
        product.TxInfo = newTxInfo.map(tx => ({
          txHash: tx.txHash,
          quantity: Number(tx.quantity),
          timestamp: Number(tx.timestamp),
        }));
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
    // order information
    addOrderInfo(state, { userId, production }) {
      if (!state.orderInfo[userId]) {
        state.orderInfo[userId] = [];
      }
      state.orderInfo[userId].push(production);
    },
    removeOrderInfo(state, { userId, index }) {
      if (state.orderInfo[userId]) {
        state.orderInfo[userId].splice(index, 1);
      }
    },
    setShippingInfo(state, { txHash, shippingData }) {
      state.shippingInfos[txHash] = shippingData;
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
    // order information
    addCoffeeOrderInfo({ commit }, { userId, production }) {
      commit('addOrderInfo', { userId, production });
    },
    deleteCoffeeOrderInfo({ commit }, { userId, index }) {
      commit('removeOrderInfo', { userId, index });
    },
    addOrUpdateConfirmedProduction({ commit }, { coffeeName, beanType, quantity, txInfo }) {
      commit('updateConfirmedProduction', { coffeeName, beanType, quantity, txInfo });
    },
    updateConfirmedProductionAfterOrder({ commit }, payload) {
      commit('updateConfirmedProductionAfterOrder', payload);
    },
    saveShippingInfo({ commit }, { txHash, shippingData }) {
      commit('setShippingInfo', { txHash, shippingData });
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
    getOrderInfo: (state) => (userId) => {
      return state.orderInfo[userId] || [];
    },
    getShippingInfo: (state) => (txHash) => {
      return state.shippingInfos[txHash];
    },
  },
  plugins: [createPersistedState()] // vuex-persistedstate 플러그인 추가
});
