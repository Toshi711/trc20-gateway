FROM node:19.3-buster as build
ARG UID=1000
ARG GID=1000
RUN userdel node
RUN groupadd --gid $GID user && \
    useradd --uid $UID --gid user --shell /bin/bash --create-home user
WORKDIR /app
RUN chown -R user:user /app
USER user

COPY --chown=user:user ./package.json ./package.json
COPY --chown=user:user ./package-lock.json ./package-lock.json
RUN npm ci


COPY --chown=user:user . .
RUN npm run build
CMD npm run start

FROM build as clearing
RUN rm -rf src


