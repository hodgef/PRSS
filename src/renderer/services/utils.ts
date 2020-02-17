import { store } from '../components/Store';

export const setBlog = (data) => {
    return store.set(data);
};