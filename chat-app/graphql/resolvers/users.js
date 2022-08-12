const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError, AuthenticationError } = require('apollo-server');
const { Op } = require('sequelize');

const { JWT_SECRET } = require('../../config/env.json');
const { Message, User } = require('../../models');

module.exports = {
  Query: {
    getUsers: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        let users = await User.findAll({
          attributes: ['username', 'imageUrl', 'createdAt'],
          where: { username: { [Op.ne]: user.username } },
        });

        const allUserMessages = await Message.findAll({
          where: {
            [Op.or]: [{ from: user.username }, { to: user.username }],
          },
          order: [['createdAt', 'DESC']],
        });

        users = users.map((u) => {
          const ltsMsg = allUserMessages.find(
            (m) => m.from === u.username || m.to === u.username
          );
          u.latestMsg = ltsMsg;
          return u;
        });

        return users;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    login: async (_, args) => {
      let { username, password } = args;
      let errors = {};

      try {
        if (username.trim() === '')
          errors.username = 'Username must not be empty!';
        if (password === '') errors.password = 'Password must not be empty!';

        if (Object.keys(errors).length > 0) {
          throw new UserInputError('Field Empty', { errors });
        }

        const user = await User.findOne({
          where: { username },
        });

        if (!user) {
          errors.username = 'User not found';
          throw new UserInputError('User not found', { errors });
        }

        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword) {
          errors.password = 'Password is incorrect';
          throw new UserInputError('Password is not correct', { errors });
        }

        const token = jwt.sign({ username }, JWT_SECRET, {
          expiresIn: 60 * 60,
        });

        return {
          ...user.toJSON(),
          token,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};

      try {
        if (email.trim() === '') errors.email = 'Email must not be empty!';
        if (password.trim() === '')
          errors.password = 'Password must not be empty!';
        if (username.trim() === '')
          errors.username = 'Username must not be empty!';
        if (confirmPassword.trim() === '')
          errors.confirmPassword = 'Repeat Password must not be empty!';

        if (password !== confirmPassword)
          errors.confirmPassword = 'Password must match';

        if (Object.keys(errors).length > 0) {
          throw errors;
        }

        password = await bcrypt.hash(password, 6);
        const user = await User.create({
          username,
          email,
          password,
        }).catch((err) => {
          throw err;
        });
        return user;
      } catch (err) {
        console.log(err);
        if (err.name === 'SequelizeUniqueConstraintError') {
          err.errors.forEach(
            (e) => (errors[e.path] = `${e.path} is already taken`)
          );
        } else if (err.name === 'SequelizeValidationError') {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError('Bad Input', { errors });
      }
    },
  },
};
