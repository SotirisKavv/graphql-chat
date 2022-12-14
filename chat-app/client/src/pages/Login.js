import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useAuthDispatch } from '../context/auth';

import { Row, Col, Form, Button } from 'react-bootstrap';

const LOGIN_USER = gql`
  query login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      username
      token
      createdAt
    }
  }
`;

export default function Login() {
  const [vars, setVars] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const dispatch = useAuthDispatch();

  const [loginUser, { loading }] = useLazyQuery(LOGIN_USER, {
    onError: (err) => {
      setErrors(err.graphQLErrors[0].extensions.errors);
    },
    onCompleted: (data) => {
      dispatch({ type: 'LOGIN', payload: data.login });
      window.location.href = '/';
    },
  });

  const submitLoginForm = (e) => {
    e.preventDefault();

    loginUser({ variables: vars });
  };

  return (
    <Row className='bg-white py-5 justify-content-center'>
      <Col sm={8} md={6} lg={4}>
        <h1 className='text-center'>Login</h1>
        <Form onSubmit={submitLoginForm}>
          <Form.Group>
            <Form.Label className={errors.username && 'text-danger'}>
              {errors.username ?? 'Username'}
            </Form.Label>
            <Form.Control
              type='text'
              className={errors.username && 'is-invalid'}
              value={vars.username}
              onChange={(e) => setVars({ ...vars, username: e.target.value })}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className={errors.password && 'text-danger'}>
              {errors.password ?? 'Password'}
            </Form.Label>
            <Form.Control
              type='password'
              className={errors.password && 'is-invalid'}
              value={vars.password}
              onChange={(e) => setVars({ ...vars, password: e.target.value })}
            />
          </Form.Group>
          <div className='text-center'>
            <Button variant='success' type='submit' disabled={loading}>
              {loading ? 'Loading..' : 'Login'}
            </Button>
            <br />
            <small>
              Don't have an account? <Link to='/register'>Register</Link>
            </small>
          </div>
        </Form>
      </Col>
    </Row>
  );
}
