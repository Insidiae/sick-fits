import React, { Component } from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Error from './ErrorMessage';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`;

const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    $id: ID!
    $title: String
    $description: String
    $price: Int
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
    ) {
      id
    }
  }
`;

class UpdateItem extends Component {
  state = {};

  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    this.setState({ [name]: val });
  }

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault();
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      }
    });
  }

  render() {
    const { id } = this.props;
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id }}>
        {({ data, loading }) => {
          if (loading) return <p>Loading...</p>;
          if (!data.item) return <p>No Item Found for Item ID: {id}</p>;
          return (
            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                <Form onSubmit={e => this.updateItem(e, updateItem)}>
                  <Error error={error} />
                  <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        name="title"
                        id="title"
                        placeholder="title"
                        defaultValue={data.item.title}
                        onChange={this.handleChange}
                        required
                      />
                    </label>
                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        name="price"
                        id="price"
                        placeholder="Price"
                        defaultValue={data.item.price}
                        onChange={this.handleChange}
                        required
                      />
                    </label>
                    <label htmlFor="description">
                      Description
                      <textarea
                        name="description"
                        id="description"
                        placeholder="Enter a description"
                        defaultValue={data.item.description}
                        onChange={this.handleChange}
                        required
                      />
                    </label>
                    <button type="submit">Sav{loading ? 'ing' : 'e'} Changes{loading && '...'}</button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}

export default UpdateItem;
export { UPDATE_ITEM_MUTATION };
