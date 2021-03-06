import * as React from 'react';
import * as renderer from 'react-test-renderer';
import gql from 'graphql-tag';
import assign = require('object-assign');

import ApolloClient from 'apollo-client';

declare function require(name: string);

import { mockNetworkInterface } from '../../../../../src/test-utils';

import { ApolloProvider, graphql } from '../../../../../src';

const query = gql`
  mutation addPerson($id: Int) {
    allPeople(id: $id) {
      people {
        name
      }
    }
  }
`;

const data = { allPeople: { people: [{ name: 'Luke Skywalker' }] } };

const createClient = variables => {
  const networkInterface = mockNetworkInterface({
    request: { query, variables },
    result: { data },
  });

  return new ApolloClient({ networkInterface, addTypename: false });
};

describe('[mutations] lifecycle', () => {
  it('allows falsy values in the mapped variables from props', done => {
    const client = createClient({ id: null });

    @graphql(query)
    class Container extends React.Component<any, any> {
      componentDidMount() {
        this.props.mutate().then(result => {
          expect(result.data).toEqual(data);
          done();
        });
      }
      render() {
        return null;
      }
    }

    renderer.create(
      <ApolloProvider client={client}>
        <Container id={null} />
      </ApolloProvider>,
    );
  });

  it("errors if the passed props don't contain the needed variables", () => {
    const client = createClient({ first: 1 });
    const Container = graphql(query)(() => null);

    try {
      renderer.create(
        <ApolloProvider client={client}>
          <Container frst={1} />
        </ApolloProvider>,
      );
    } catch (e) {
      expect(e).toMatch(/Invariant Violation: The operation 'addPerson'/);
    }
  });

  it('rebuilds the mutation on prop change when using `options`', done => {
    const client = createClient({});

    function options(props) {
      // expect(props.listId).toBe(2);
      return {};
    }

    @graphql(query, { options })
    class Container extends React.Component<any, any> {
      componentWillReceiveProps(props) {
        if (props.listId !== 2) return;
        props.mutate().then(x => done());
      }
      render() {
        return null;
      }
    }

    class ChangingProps extends React.Component<any, any> {
      state = { listId: 1 };

      componentDidMount() {
        setTimeout(() => this.setState({ listId: 2 }), 50);
      }

      render() {
        return <Container listId={this.state.listId} />;
      }
    }

    renderer.create(
      <ApolloProvider client={client}>
        <ChangingProps />
      </ApolloProvider>,
    );
  });

  it('can execute a mutation with custom variables', done => {
    const client = createClient({ id: 1 });

    @graphql(query)
    class Container extends React.Component<any, any> {
      componentDidMount() {
        this.props.mutate({ variables: { id: 1 } }).then(result => {
          expect(result.data).toEqual(data);
          done();
        });
      }
      render() {
        return null;
      }
    }

    renderer.create(
      <ApolloProvider client={client}>
        <Container />
      </ApolloProvider>,
    );
  });

  it('accepts client in options', done => {
    const client = createClient({});

    @graphql(query, { options: () => ({ client }) })
    class Container extends React.Component<any, any> {
      componentWillReceiveProps(props) {
        if (props.listId !== 2) return;
        props.mutate().then(x => done());
      }
      render() {
        return null;
      }
    }

    class ChangingProps extends React.Component<any, any> {
      state = { listId: 1 };

      componentDidMount() {
        setTimeout(() => this.setState({ listId: 2 }), 50);
      }

      render() {
        return <Container listId={this.state.listId} />;
      }
    }

    renderer.create(
      <ApolloProvider client={client}>
        <ChangingProps />
      </ApolloProvider>,
    );
  });
});
