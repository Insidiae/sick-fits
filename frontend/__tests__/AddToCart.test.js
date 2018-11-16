import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { ApolloConsumer } from 'react-apollo';
import { MockedProvider } from 'react-apollo/test-utils';
import AddToCart, { ADD_TO_CART_MUTATION } from '../components/AddToCart';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeCartItem } from '../lib/testUtils';

const mocks = [
  // CURRENT_USER_QUERY mock (1st call)
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [],
        },
      },
    },
  },
  // CURRENT_USER_QUERY mock (2nd call)
  // Because the current user's data gets updated via refetch,
  // we also need to mock the response from that 2nd call
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
  // ADD_TO_CART_MUTATION mock
  {
    request: {
      query: ADD_TO_CART_MUTATION,
      variables: { id: 'abc123' },
    },
    result: {
      data: {
        addToCart: {
          ...fakeCartItem(),
          quantity: 1,
        },
      },
    },
  },
];

describe('<AddToCart/>', () => {
  it('renders and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <AddToCart id="abc123" />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('button'))).toMatchSnapshot();
  });

  it('adds an item to the user\'s cart when clicked', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            return <AddToCart id="abc123" />
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const { data: { me } } = await apolloClient.query({ query: CURRENT_USER_QUERY });
    // The user's cart should not contain any items initially
    expect(me.cart).toHaveLength(0);
    // Add an item to the cart
    wrapper.find('button').simulate('click');
    await wait();
    wrapper.update();
    const { data: { me: updatedMe } } = await apolloClient.query({ query: CURRENT_USER_QUERY });
    expect(updatedMe.cart).toHaveLength(1);
    // NOTE: These data were returned from the fakeCartItem()
    expect(updatedMe.cart[0].id).toEqual('omg123');
    expect(updatedMe.cart[0].quantity).toEqual(3);
  });

  it('changes the button\'s text when clicked', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <AddToCart id="abc123" />
      </MockedProvider>
    );
    // Initially, the button's text chould contain 'Add To Cart'
    expect(wrapper.text()).toContain('Add To Cart');
    // When the button is clicked, its text should change while in the loading state
    wrapper.find('button').simulate('click');
    expect(wrapper.text()).toContain('Adding To Cart...');
  });
});
