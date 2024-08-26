<template>
  <div class="content">
      <figure class="left-video"><img src="../../public/img/ShippingInfo.png" alt="Coffee Cup"></figure>
      <div class="right-side">
          <h2>Shipping Info</h2>
          <div id="panel" class="panel-container">
              <strong>Tracking Number: {{ trackingNumber }}</strong>
              <div v-if="shippingData">
                  <p><strong>Status:</strong> {{ shippingData.status }}</p>
                  <p><strong>Estimated Delivery:</strong> {{ shippingData.estimatedDelivery }}</p>
                  <p><strong>Current Location:</strong> {{ shippingData.currentLocation }}</p>
              </div>
              <div v-else>
                  <p>Loading shipping data...</p>
              </div>
              <button class="btn" id="refresh" @click="fetchShippingInfo">Refresh</button>
          </div>
      </div>
  </div>
</template>

<script>
// import Web3 from 'web3';

export default {
  name: 'ShippingInfoPage',
  data() {
      return {
          web3: null,
          contract: null,
          trackingNumber: '123456789',
          shippingData: {
              status: 'In Transit',
              estimatedDelivery: '2024-08-20',
              currentLocation: 'New York, NY',
          }, // Example static data
      };
  },
  methods: {
      fetchShippingInfo() {
          // 스마트 컨트랙트 호출 관련 코드는 주석 처리되었습니다.
          // try {
          //     const data = await this.contract.methods.getShippingInfo(this.trackingNumber).call();
          //     this.shippingData = {
          //         status: data[0],
          //         estimatedDelivery: data[1],
          //         currentLocation: data[2],
          //     };
          // } catch (error) {
          //     console.error('Error fetching shipping data:', error);
          // }
          
          // 현재는 페이지를 로드할 때 고정된 데이터를 사용합니다.
          alert('Fetching updated shipping information...');
      },
  },
  // async mounted() {
  //     // Web3 인스턴스 생성 및 스마트 컨트랙트 초기화 관련 코드는 주석 처리되었습니다.
  //     if (window.ethereum) {
  //         this.web3 = new Web3(window.ethereum);
  //         try {
  //             await window.ethereum.enable();
  //             const networkId = await this.web3.eth.net.getId();
  //             const deployedNetwork = YourContract.networks[networkId];
  //             this.contract = new this.web3.eth.Contract(
  //                 YourContract.abi,
  //                 deployedNetwork && deployedNetwork.address,
  //             );
  //             this.fetchShippingInfo();
  //         } catch (error) {
  //             console.error('User denied account access or error occurred:', error);
  //         }
  //     } else if (window.web3) {
  //         this.web3 = new Web3(window.web3.currentProvider);
  //     } else {
  //         console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  //     }
  // },
};
</script>

<style scoped>
h2{
  font-family: 'Great Vibes', cursive;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 10vh;
  font-size: 2.3em;
}
.content{
background: #ffc99f;
}
.right-side{
 background: #C69B7B;
}
.panel-container {
background-color: white;
box-shadow: 3 10px 3px rgba(0, 0, 0, 0.5);
border-radius: 20px;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
text-align: center;
padding: 40px;
max-width: 480px;
margin:10% auto 2% auto;
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
}
.btn:focus {
outline: 0;
}
.btn:active {
transform: scale(0.98);
}
.btn:hover{
background: rgb(182, 181, 181);
}
img{
  width: 100%;
  filter: drop-shadow(1px 1px 60px white);
}
figure{
  width: 20%;
  position: absolute;
  left: 5%;
  bottom: 25%;
}
</style>
