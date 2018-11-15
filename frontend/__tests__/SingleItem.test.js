import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import SingleItem, { SINGLE_ITEM_QUERY } from '../components/SingleItem';
import { fakeItem } from '../lib/testUtils';

describe('<SingleItem/>', () => {
  it('renders with proper data', async () => {
    const mocks = [
      {
        // When someone makes a request with this query and variable combo:
        request: {
          query: SINGLE_ITEM_QUERY,
          variables: { id: '123' },
        },
        // Return this fake data (mocked data)
        // NOTE: The mocked data should be exactly the same as what the actual GraphQL qeury returns
        result: {
          data: {
            item: fakeItem(),
          },
        },
      },
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    // Should display 'Loading...' at initial render
    expect(wrapper.text()).toContain('Loading...');
    // Wait for 0 milliseconds
    // This ensures that the wrapper updates after the Queries have been resolved
    await wait();
    wrapper.update();
    // Just find() the pieces of the component that you want to be testing
    // you don't want the entire MockedProvider to be included in the snapshot, as the snapshots will be quite large.
    expect(toJSON(wrapper.find('h2'))).toMatchSnapshot();
    expect(toJSON(wrapper.find('img'))).toMatchSnapshot();
    expect(toJSON(wrapper.find('p'))).toMatchSnapshot();
  });

  it('displays an error when the item is not found', async () => {
    const mocks = [
      {
        // When someone makes a request with this query and variable combo:
        request: {
          query: SINGLE_ITEM_QUERY,
          variables: { id: '123' },
        },
        // Return this fake data (mocked data)
        // NOTE: The mocked data should be exactly the same as what the actual GraphQL query returns
        result: {
          errors: [{ message: 'Item not found!' }]
        },
      },
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // The ErrorMessage component, in this case,
    // has a <p> tag with data-test="graphq-error" prop
    const item = wrapper.find('[data-test="graphql-error"]');
    expect(toJSON(item)).toMatchSnapshot();
  });
});
