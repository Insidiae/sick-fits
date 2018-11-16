import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import Cart, { LOCAL_STATE_QUERY } from '../components/Cart';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeCartItem } from '../lib/testUtils';

const mocks = [
  // CURRENT_USER_QUERY mock
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [fakeCartItem()],
        },
      },
    },
  },
  // LOCAL_STATE_QUERY mock
  {
    request: { query: LOCAL_STATE_QUERY },
    result: {
      data: { cartOpen: true },
    },
  },
];

describe('<Cart/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <Cart />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // Check if header is being rendered properly
    expect(toJSON(wrapper.find('header'))).toMatchSnapshot();
    // Check if the user has only one item in their cart
    expect(wrapper.find('CartItem')).toHaveLength(1);
  });
});
