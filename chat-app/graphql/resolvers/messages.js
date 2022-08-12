const {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
} = require('apollo-server');
const { withFilter } = require('graphql-subscriptions');
const { Op } = require('sequelize');

const { User, Message, Reaction } = require('../../models');

module.exports = {
  Query: {
    getMessages: async (_, { from }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const sender = await User.findOne({ where: { username: from } });
        if (!sender) {
          throw new UserInputError('User not found!');
        }

        const unames = [user.username, sender.username];

        const messages = await Message.findAll({
          where: {
            from: { [Op.in]: unames },
            to: { [Op.in]: unames },
          },
          order: [['createdAt', 'DESC']],
          include: [{ model: Reaction, as: 'reactions' }],
        });

        return messages;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    sendMessage: async (_, { to, content }, { user, pubsub }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const rec = await User.findOne({ where: { username: to } });

        if (!rec) {
          throw new UserInputError('User not found!');
        }

        if (content.trim() === '') {
          throw new UserInputError('Empty message!');
        }

        const msg = await Message.create({
          from: user.username,
          to,
          content,
        });

        pubsub.publish('NEW_MESSAGE', { newMessage: msg });

        return msg;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    reactToMessage: async (_, { uuid, content }, { user, pubsub }) => {
      const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎'];

      try {
        if (!reactions.includes(content))
          throw new UserInputError('Invalid Reaction');

        const username = user ? user.username : '';
        user = await User.findOne({ where: { username } });
        if (!user) throw new AuthenticationError('Unauthenticated');

        const message = await Message.findOne({ where: { uuid } });
        if (!message) throw new UserInputError('Message not found');

        if (message.from !== user.username && message.to !== user.username) {
          throw new ForbiddenError('Unauthorized');
        }

        let reaction = await Reaction.findOne({
          where: { messageId: message.id, userId: user.id },
        });

        if (reaction) {
          reaction.content = content;
          await reaction.save();
        } else {
          reaction = Reaction.create({
            messageId: message.id,
            userId: user.id,
            content,
          });
        }
        pubsub.publish('NEW_REACTION', { newReaction: reaction });

        return reaction;
      } catch (err) {
        throw err;
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, { pubsub, user }) => {
          if (!user) throw new AuthenticationError('Unauthenticated');

          return pubsub.asyncIterator(['NEW_MESSAGE']);
        },
        ({ newMessage }, _, { user }) =>
          newMessage.from === user.username || newMessage.to === user.username
      ),
    },
    newReaction: {
      subscribe: withFilter(
        (_, __, { pubsub, user }) => {
          if (!user) throw new AuthenticationError('Unauthenticated');

          return pubsub.asyncIterator(['NEW_REACTION']);
        },
        async ({ newReaction }, _, { user }) => {
          const message = await newReaction.getMessage();
          return message.from === user.username || message.to === user.username;
        }
      ),
    },
  },
};
