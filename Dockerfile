FROM node:18-alpine

WORKDIR /app

# Instalacja zależności niezbędnych do komunikacji z Apache Camel
RUN apk add --no-cache openjdk11-jre maven curl

# Instalacja Apache Camel
RUN mkdir -p /opt/apache-camel && \
    curl -L https://downloads.apache.org/camel/camel-4.0.0/apache-camel-4.0.0.tar.gz | \
    tar -xz -C /opt/apache-camel --strip-components=1

# Ustawienie zmiennych środowiskowych dla Apache Camel
ENV CAMEL_HOME=/opt/apache-camel
ENV PATH=$PATH:$CAMEL_HOME/bin

# Instalacja Hawtio (opcjonalny panel administracyjny)
RUN mkdir -p /opt/hawtio && \
    curl -L https://github.com/hawtio/hawtio/releases/download/hawtio-2.17.0/hawtio-app-2.17.0.jar \
    -o /opt/hawtio/hawtio-app.jar

# Kopiowanie plików package.json i package-lock.json
COPY package*.json ./

# Instalacja zależności Node.js
RUN npm install

# Tworzenie katalogów dla danych i logów
RUN mkdir -p /app/data /app/logs

# Kopiowanie konfiguracji i skryptów
COPY config/ ./config/
COPY scripts/ ./scripts/
COPY camel-routes.xml ./

# Nadanie uprawnień do wykonania skryptów
RUN chmod +x ./scripts/*.sh

# Kopiowanie kodu źródłowego
COPY src/ ./src/

# Skrypt entrypoint.sh
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Uruchamianie aplikacji
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]