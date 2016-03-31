FROM node:slim

# App
COPY . /

# Install app dependencies
RUN npm install


EXPOSE  80
CMD ["node", "test.js"]

