<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="close-button" @click="closeModal(isCustomer)">×</button>
      <h2>Shipping Info</h2>
      <div class="panel-container">
        <!-- Tracking Number 입력 필드 -->
        <div v-if="!isCustomer" class="form-group">
          <label for="trackingNumber"><strong>Tracking Number:</strong></label>
          <input
            type="text"
            id="trackingNumber"
            v-model="localTrackingNumber"
            placeholder="Enter Tracking Number"
            @change="fetchShippingData"
          />
        </div>
        <!-- 배송 정보 입력 필드 -->
        <div class="form-group">
          <label for="status"><strong>Status:</strong></label>
          <select
            v-model="shippingData.status"
            id="status"
            :class="{ 'readonly-select': isCustomer }"
            :disabled=false
          >
            <option disabled value="">Order Received</option>
            <option v-for="option in statusOptions" :key="option">{{ option }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="estimatedDelivery"><strong>Estimated Delivery:</strong></label>
          <input
            type="date"
            id="estimatedDelivery"
            v-model="shippingData.estimatedDelivery"
            placeholder="YYYY-MM-DD"
            :readonly="isCustomer"
            lang="en"
          />
        </div>
        <div class="form-group">
          <label for="currentLocation"><strong>Current Location:</strong></label>
          <input
            type="text"
            id="currentLocation"
            v-model="shippingData.currentLocation"
            placeholder="CoffeeAndCom Logistics storage"
            :class="{ 'readonly-input': isCustomer }"
            :disabled="isCustomer"
          />
        </div>


        <!-- Save 버튼 -->
        <button class="btn" v-if="!isCustomer" @click="handleSaveShippingInfo">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'ShippingInfoModal',
  props: {
    trackingNumber: {
      type: String,
      required: true,
    },
    initialShippingData: {
      type: Object,
      default: () => ({
        status: '',
        estimatedDelivery: '',
        currentLocation: '',
      }),
    },
  },
  data() {
    return {
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      isCustomer: false,
      localTrackingNumber: '', // 로컬 데이터 속성으로 변경
      shippingData: {
        status: '',
        estimatedDelivery: '',
        currentLocation: '',
      },
      statusOptions: [
        // 'Order Received',
        'Preparing for Shipment',
        'In Transit',
        'Out for Delivery',
        'Delivered',
        'Delayed',
        'Exception',
      ],
    };
  },
  computed: {
    ...mapGetters(['getShippingInfo']),
  },
  methods: {
    ...mapActions(['saveShippingInfo']),
    closeModal(isCustomer) {
      if (isCustomer) {
        this.$emit('close');
      }
      else {
        this.$router.push({ name: 'manageingpage' });
      }
    },
    handleSaveShippingInfo() {
      if (!this.localTrackingNumber) {
        alert('Please enter a Tracking Number.');
        return;
      }
      // 배송 정보 저장 또는 업데이트
      this.saveShippingInfo({
        txHash: this.localTrackingNumber,
        shippingData: this.shippingData,
      });
      alert('Shipping information saved successfully.');
      this.$router.push({ name: 'manageingpage' });
    },
    fetchShippingData() {
      console.log('Fetching Shipping Data for txHash:', this.localTrackingNumber);
      const savedShippingData = this.getShippingInfo(this.localTrackingNumber);
      console.log('Fetched Shipping Data:', savedShippingData);
      if (savedShippingData) {
        this.shippingData = { ...savedShippingData };
      } else {
        // 데이터가 없으면 초기화
        this.shippingData = {
          status: '',
          estimatedDelivery: '',
          currentLocation: '',
        };
      }
    },
  },
  mounted() {
    if (this.logedUser) {
      this.isCustomer = this.logedUser.customer;
    }
    // 모든 경우에 localTrackingNumber를 trackingNumber로 설정
    this.localTrackingNumber = this.trackingNumber;
    console.log('Mounted with trackingNumber:', this.trackingNumber);
    this.fetchShippingData();
    // 초기 배송 데이터 설정
    this.shippingData = { ...this.initialShippingData };
  },
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #c69b7b;
  padding: 20px;
  border-radius: 10px 0 0 10px;
  position: absolute;
  left: 57%;
  width: 400px;
  overflow-y: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

h2 {
  font-family: 'Great Vibes', cursive;
  text-align: center;
  margin-bottom: 20px;
  font-size: 2em;
}

.panel-container {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
}

.panel-container p {
  font-size: 16px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

select,
input[type='date'],
input[type='text'] {
  width: 100%;
  padding: 8px;
  border: 1px solid #1b1b1b;
  border-radius: 5px;
  box-sizing: border-box;
}

.btn {
  background-color: gainsboro;
  color: #000;
  border: 0;
  border-radius: 4px;
  padding: 12px 30px;
  cursor: pointer;
  width: 100%;
}

.btn:hover {
  background: rgb(182, 181, 181);
}

.btn:focus {
  outline: 0;
}

.btn:active {
  transform: scale(0.98);
}
/* 기본 화살표 아이콘을 숨기는 CSS */
.readonly-select {
  -webkit-appearance: none; /* 크롬, 사파리 */
  -moz-appearance: none; /* 파이어폭스 */
  appearance: none; /* 최신 표준 */
  background-color: #f0f0f0; /* 배경색 그대로 유지 */
  color: #000 !important; /* 텍스트 색상 유지 */
  padding-right: 20px; /* 화살표 공간 제거 */
  background-image: none; /* 화살표 숨기기 */
}
.readonly-input {
  color: #000 !important; /* 텍스트를 진하게 유지 */
  opacity: 1 !important;
  font-weight: bold;
  background-color: #f0f0f0; /* 배경색 설정 */
  pointer-events: none; /* 상호작용 비활성화 */
}
input:disabled {
  color: #000 !important; /* 텍스트 색상 유지 */
  font-weight: bold; /* 글씨를 진하게 유지 */
  background-color: #f0f0f0; /* 배경색 설정 */
  opacity: 1 !important; /* 흐리게 표시되지 않도록 */
}
.getShippingInfoButton {
  padding: 10px 20px; /* 패딩을 늘려 버튼을 더 크게 */
  font-weight: 600; /* 글씨 두께를 증가시켜 강조 */
  border-radius: 8px; /* 모서리를 둥글게 */
  cursor: pointer; /* 커서를 포인터로 변경 */
  background-color: #6B8E23; /* 올리브 그린 배경색 */
  color: white; /* 텍스트 색상을 흰색으로 */
  border: none; /* 기본 테두리 제거 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 약간의 그림자 추가 */
  transition: background-color 0.3s ease, transform 0.2s; /* 부드러운 전환 효과 */
}

.getShippingInfoButton:hover {
  background-color: #556B2F; /* 호버 시 더 진한 그린 */
  transform: scale(1.05); /* 약간 확대 */
}

.getShippingInfoButton:active {
  transform: scale(0.95); /* 클릭 시 약간 축소 */
}

</style>
