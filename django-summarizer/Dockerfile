#FROM python:3.11-bullseye
FROM nvidia/cuda:12.1.0-base-ubuntu20.04

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get remove --purge python3
    
RUN apt-get install -y \
        libglib2.0-0 \
        wget \
        build-essential \
        libssl-dev \
        libffi-dev \
        zlib1g-dev \
        libbz2-dev \
        libreadline-dev \
        libsqlite3-dev \
        llvm \
        libncurses5-dev \
        libncursesw5-dev \
        xz-utils \
        tk-dev \
        libffi-dev \
        liblzma-dev \
        python3-dev \
        python3-pip

RUN wget https://www.python.org/ftp/python/3.11.5/Python-3.11.5.tgz && \
    tar -xvf Python-3.11.5.tgz && \
    cd Python-3.11.5 && \
    ./configure --enable-optimizations && \
    make && \
    make install

WORKDIR /app
RUN python3 -m pip install --upgrade pip
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
#RUN pip3 install --upgrade numpy
#RUN pip3 install torch torchvision torchaudio -f https://download.pytorch.org/whl/cu121/torch_stable.html
#RUN pip3 install torch torchvision torchaudio

RUN rm -rf Python-3.11.5 && \
    apt-get purge -y --auto-remove \
    wget \
    build-essential \
    libssl-dev \
    libffi-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    llvm \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    liblzma-dev \
    python3-dev && \
    apt-get clean

# Set the default Python version
RUN ln -sf /usr/local/bin/pip3 /usr/local/bin/pip && \
    ln -sf /usr/local/bin/python3 /usr/local/bin/python

COPY /summarizer /app/summarizer
WORKDIR /app/summarizer
EXPOSE 8002

CMD python3 manage.py runserver 0.0.0.0:8002
