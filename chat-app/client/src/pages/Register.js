import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';

import { Row, Col, Form, Button } from 'react-bootstrap';

const REGISTER_USER = gql`
  mutation register(
    $username: String!
    $email: String!
    $password: String!
    $confirmPassword: String!
  ) {
    register(
      username: $username
      email: $email
      password: $password
      confirmPassword: $confirmPassword
    ) {
      username
      email
      createdAt
    }
  }
`;

export default function Register() {
  const [vars, setVars] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const history = useNavigate();

  const [registerUser, { loading }] = useMutation(REGISTER_USER, {
    update: (_, __) => {
      history('/login');
    },
    onError: (err) => {
      setErrors(err.graphQLErrors[0].extensions.errors);
    },
  });

  const submitRegisterForm = (e) => {
    e.preventDefault();

    registerUser({ variables: vars });
  };

  return (
    <Row className='bg-white py-5 justify-content-center'>
      <Col sm={8} md={6} lg={4}>
        <h1 className='text-center'>Register</h1>
        <Form onSubmit={submitRegisterForm}>
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
            <Form.Label className={errors.email && 'text-danger'}>
              {errors.email ?? 'Email Address'}
            </Form.Label>
            <Form.Control
              type='email'
              className={errors.email && 'is-invalid'}
              value={vars.email}
              onChange={(e) => setVars({ ...vars, email: e.target.value })}
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
          <Form.Group>
            <Form.Label className={errors.confirmPassword && 'text-danger'}>
              {errors.confirmPassword ?? 'Repeat Password'}
            </Form.Label>
            <Form.Control
              type='password'
              className={errors.confirmPassword && 'is-invalid'}
              value={vars.confirmPassword}
              onChange={(e) =>
                setVars({ ...vars, confirmPassword: e.target.value })
              }
            />
          </Form.Group>
          <div className='text-center'>
            <Button variant='success' type='submit' disabled={loading}>
              {loading ? 'Loading..' : 'Register'}
            </Button>
            <br />
            <small>
              Already have an account? <Link to='/login'>Login</Link>
            </small>
          </div>
        </Form>
      </Col>
    </Row>
  );
}
