#!/usr/bin/env python3
"""Gera posts-pacote/posts.html a partir de posts.src.html, injetando a classe .wm (logotipo oficial
ESTOKE / AO CUBO em vetor) copiada de posts-insta/posts.html. Uso: python3 posts-pacote/build.py"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DIR)
wm = next(l for l in open(os.path.join(ROOT, "posts-insta", "posts.html"), encoding="utf-8") if l.lstrip().startswith(".wm {"))
src = open(os.path.join(DIR, "posts.src.html"), encoding="utf-8").read()
open(os.path.join(DIR, "posts.html"), "w", encoding="utf-8").write(src.replace("/*WM*/", wm.strip()))
print("posts-pacote/posts.html")
