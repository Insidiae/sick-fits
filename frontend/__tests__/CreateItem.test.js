import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import Router from 'next/router'
import { MockedProvider } from 'react-apollo/test-utils';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';

// Create a mock secure_url
const dogImage = 'https://dog.com/dog.jpg';
const dogLargeImage = 'https://dog.com/dog-large.jpg';

// Mock the global fetch API
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({
    secure_url: dogImage,
    eager: [{ secure_url: dogLargeImage }],
  }),
});

describe('<CreateItem/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it('uploads an image file when the file input is changed', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const fileInput = wrapper.find('input[type="file"]');
    fileInput.simulate('change', {
      target: {
        files: ['fakedog.jpg'],
      },
    });
    await wait();
    wrapper.update();
    const component = wrapper.find('CreateItem').instance();
    expect(global.fetch).toHaveBeenCalled();
    expect(component.state.image).toEqual(dogImage);
    expect(component.state.largeImage).toEqual(dogLargeImage);
    // Reset the global.fetch() to its initial state
    global.fetch.mockReset();
  });

  it('handles state updating', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const stateMock = {
      title: 'Testing',
      price: 1299,
      description: 'Testing 123',
    };
    wrapper.find('#title').simulate('change', {
      target: {
        name: 'title',
        value: stateMock.title,
      },
    });
    wrapper.find('#price').simulate('change', {
      target: {
        name: 'price',
        type: 'number',
        value: stateMock.price,
      },
    });
    wrapper.find('#description').simulate('change', {
      target: {
        name: 'description',
        value: stateMock.description,
      },
    });
    expect(wrapper.find('CreateItem').instance().state).toMatchObject(stateMock);
  });

  it('creates a new item when the form is submitted', async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            image: '',
            largeImage: '',
            price: item.price,
          },
        },
        result: {
          data: {
            createItem: {
              ...item,
              typename: 'Item',
            },
          },
        },
      },
    ];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );

    // Simulate someone filling out the form
    wrapper.find('#title').simulate('change', {
      target: {
        name: 'title',
        value: item.title,
      },
    });
    wrapper.find('#price').simulate('change', {
      target: {
        name: 'price',
        type: 'number',
        value: item.price,
      },
    });
    wrapper.find('#description').simulate('change', {
      target: {
        name: 'description',
        value: item.description,
      },
    });

    // Mock the Next.js router
    Router.router = { push: jest.fn() };

    // Simulate form submission
    wrapper.find('form').simulate('submit');
    await wait(50);

    // Test if the page is routed when the new item is created
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({ pathname: '/item', query: { id: 'abc123' } });
  });
});
