import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import GoogleMapReact from 'google-map-react'
import { Key } from './key'
import { debounce } from 'lodash'

const MyPositionMarker = ({ text }) => (
  <div className="d-flex align-items-center MyPosition">
    <img
      src="/img/icon-map.png"
      alt=""
      style={{ width: '30px', height: '30px' }}
    />
    <span className="form-check-label">{text}</span>
  </div>
)

const SimpleMap = (props) => {
  const [myPosition, setMyPosition] = useState({
    lat: 25.04,
    lng: 121.5,
  })

  const [mapApiLoaded, setMapApiLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState(null)
  const [mapApi, setMapApi] = useState(null)
  const [places, setPlaces] = useState([])
  const [searchType, setSearchType] = useState()
  const [inputText, setInputText] = useState('')
  const [autocompleteResults, setAutocompleteResults] = useState([])
  const [currentCenter, setCurrentCenter] = useState({})
  const [modalPlaceID, setModalPlaceID] = useState()
  const [modalData, setModalData] = useState({
    name: '',
    formatted_address: '',
    rating: '',
    opening_hours: {
      isOpen: () => {
        return false
      },
      weekday_text: '',
    },
    formatted_phone_number: '',
  })

  // MODAL 控制
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  let inputRef = useRef(null)

  // 當地圖載入完成，將地圖實體與地圖 API 傳入 state 供之後使用
  // map :物件，指的就是所見的地圖，為了取得地圖上的資訊
  // maps:物件，指的是GoogleMaps API，調用方法以搜尋附近地標資訊等
  const apiHasLoaded = (map, maps) => {
    setMapInstance(map)
    setMapApi(maps)
    setMapApiLoaded(true)
    setSearchType('restaurant')
  }

  // 地圖移動更改中心點
  const handleCenterChange = () => {
    if (mapApiLoaded) {
      setMyPosition({
        lat: mapInstance.center.lat(),
        lng: mapInstance.center.lng(),
      })
    }
  }

  // 切換搜尋種類
  const handleSearchType = (e) => {
    setSearchType(e.target.name)
  }

  // 執行 搜詢附近餐廳/酒吧/咖啡廳
  const findLocation = () => {
    if (mapApiLoaded) {
      const service = new mapApi.places.PlacesService(mapInstance)

      // location :搜尋中心 ; redius :搜尋半徑(單位:公尺) ; type: 地標種類
      const request = {
        location: myPosition,
        radius: 4000,
        type: searchType,
      }

      service.nearbySearch(request, (results, status) => {
        if (status === mapApi.places.PlacesServiceStatus.OK) {
          setPlaces(results)
        }
      })
    }
  }

  /*
  CafeMaker :地圖上餐廳標記
  CafeList  :地圖上餐廳列表
  */
  const CafeMaker = ({ icon, text, placeId }) => (
    <div className="d-flex MyTarget align-items-center">
      <img src={icon} style={{ height: '30px', width: '30px' }} alt="" />
      <span
        className="form-check-label "
        onClick={() => {
          handleShow()
          setModalPlaceID(placeId)
        }}
      >
        {text}
      </span>
    </div>
  )

  const CafeList = ({ icon, text, placeId }) => (
    <div
      className="d-flex ListItem mt-1 align-items-center"
      onClick={() => {
        handleShow()
        setModalPlaceID(placeId)
      }}
    >
      <img src={icon} style={{ height: '30px', width: '30px' }} alt="" />
      <span className="form-check-label ml-2 mr-2">{text}</span>
    </div>
  )

  //自動輸入地址
  const handleAutocomplete = () => {
    if (mapApiLoaded) {
      const service = new mapApi.places.AutocompleteService()
      const request = {
        input: inputText, // input 為 inputText
      }

      service.getPlacePredictions(request, (results, status) => {
        if (status === mapApi.places.PlacesServiceStatus.OK) {
          setAutocompleteResults(results)
        }
      })
    }
  }

  //地圖搜尋更改位置
  const handleClickToChangeMyPosition = (e) => {
    const placeId = e.target.getAttribute('dataid')
    const service = new mapApi.places.PlacesService(mapInstance)
    const request = {
      placeId,
      ffields: [
        'name',
        'rating', // 評價
        'formatted_address', // 地址
        'formatted_phone_number', // 電話
        'geometry', // 幾何資訊
        'opening_hours', // 營業時間資訊
      ],
    }

    service.getDetails(request, (results, status) => {
      if (status === mapApi.places.PlacesServiceStatus.OK) {
        console.log(results)
        // console.log(results.opening_hours.isOpen())
        const newPosition = {
          lat: results.geometry.location.lat(),
          lng: results.geometry.location.lng(),
        }
        setCurrentCenter(newPosition) // 改變地圖視角位置
        setMyPosition(newPosition) // 改變 MyPosition
        setAutocompleteResults([]) // 清空自動搜尋地址清單
        inputRef.current.value = '' // 清空 <input>
      }
    })
  }

  const getModalData = () => {
    if (places != 0) {
      const placeId = modalPlaceID
      const service = new mapApi.places.PlacesService(mapInstance)
      const request = {
        placeId,
        fields: [
          'name',
          'rating', // 評價
          'formatted_address', // 地址
          'formatted_phone_number', // 電話
          'geometry', // 幾何資訊
          'opening_hours', // 營業時間資訊
        ],
      }

      service.getDetails(request, (results, status) => {
        if (status === mapApi.places.PlacesServiceStatus.OK) {
          setModalData(results)
          console.log(results)
        }
      })
    }
  }

  const handleInput = () => {
    setInputText(inputRef.current.value)
  }

  useEffect(() => {
    findLocation()
  }, [searchType, myPosition])

  useEffect(() => {
    handleAutocomplete()
  }, [inputText])

  useEffect(() => {
    getModalData()
  }, [show])

  return (
    // Important! Always set the container height explicitly
    <>
      <div style={{ height: '100vh', width: '100%' }}>
        <div className="fixed-top d-flex flex-column ml-5">
          <div className="d-flex">
            <input
              type="button"
              value="找餐廳"
              onClick={handleSearchType}
              name="restaurant"
              className="btn sm primary-btn mt-2 mr-2"
            />
            <input
              type="button"
              value="找酒吧"
              onClick={handleSearchType}
              name="bar"
              className="btn sm primary-btn mt-2 mr-2"
            />
            <input
              type="button"
              value="找咖啡廳"
              onClick={handleSearchType}
              name="cafe"
              className="btn sm primary-btn mt-2 mr-2"
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="primary-input mt-2"
            style={{ width: '300px' }}
            onChange={debounce(handleInput, 500)}
          />

          <div className="SearchList" onClick={handleClickToChangeMyPosition}>
            {autocompleteResults && inputText
              ? autocompleteResults.map((item) => (
                  <div key={item.id} dataid={item.place_id}>
                    　{item.description.trim()}
                  </div>
                ))
              : null}
          </div>
        </div>
        <div className="MyList d-flex flex-column" id="style-3">
          {places.map((v, i) => {
            return (
              <CafeList
                icon={v.icon}
                key={v.id}
                lat={v.geometry.location.lat()}
                lng={v.geometry.location.lng()}
                text={v.name}
                placeId={v.place_id}
                className="mt-2"
              />
            )
          })}
        </div>
        <GoogleMapReact
          center={
            JSON.stringify(currentCenter) === '{}'
              ? props.center
              : currentCenter
          }
          bootstrapURLKeys={{ key: Key, libraries: ['places'] }}
          onBoundsChange={handleCenterChange}
          defaultCenter={props.center}
          defaultZoom={props.zoom}
          yesIWantToUseGoogleMapApiInternals // 設定為 true
          onGoogleApiLoaded={({ map, maps }) => apiHasLoaded(map, maps)} // 載入完成後執行
        >
          {places.map((v, i) => {
            return (
              <CafeMaker
                icon={v.icon}
                key={v.id}
                lat={v.geometry.location.lat()}
                lng={v.geometry.location.lng()}
                text={v.name}
                placeId={v.place_id}
              />
            )
          })}
          <MyPositionMarker
            lat={myPosition.lat}
            lng={myPosition.lng}
            text="MyPosition"
          />
        </GoogleMapReact>
      </div>

      <Modal
        className="addtocart-success-modal"
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          {modalData.name ? modalData.name : ''}
        </Modal.Header>
        <Modal.Body>
          <h6>
            {modalData.formatted_address ? modalData.formatted_address : ''}
          </h6>
          <h6>評分：{modalData.rating ? modalData.rating : ''}</h6>
          <h6>
            <span
              className={
                modalData.opening_hours.isOpen() ? 'isOPEN' : 'isCLOSE'
              }
            >
              {modalData.opening_hours.isOpen() ? '✔營業中' : '✘休息中'}
            </span>
          </h6>
          <h6>營業時間</h6>
          <table className="modalTable">
            {modalData.opening_hours.weekday_text
              ? modalData.opening_hours.weekday_text.map((v, i) => {
                  return <tr key={i}> {v}</tr>
                })
              : ''}
          </table>

          <h6>
            {modalData.formatted_phone_number
              ? modalData.formatted_phone_number
              : ''}
          </h6>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <button
            className="btn important-btn md"
            onClick={() => {
              handleClose()
            }}
          >
            關閉
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

SimpleMap.defaultProps = {
  center: {
    lat: 25.04,
    lng: 121.5,
  },
  zoom: 17,
}

export default SimpleMap
