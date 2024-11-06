import axios from 'axios';
import { 
    PRODUCT_LIST_REQUEST,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_LIST_FAIL
} from '../constants/productConstants';

export const listProducts = () => async (dispatch) => {
    try {
        // Start the request, setting loading to true
        dispatch({ type: PRODUCT_LIST_REQUEST });

        // Fetch data from API
        const { data } = await axios.get('/api/products/');

        // On success, dispatch data to the reducer
        dispatch({
            type: PRODUCT_LIST_SUCCESS,
            payload: data
        });

    } catch (error) {
        // Dispatch failure with error message
        dispatch({
            type: PRODUCT_LIST_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};
