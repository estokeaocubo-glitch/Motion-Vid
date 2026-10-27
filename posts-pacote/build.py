#!/usr/bin/env python3
"""Grava posts-pacote/base.css a partir de base.src.css, injetando a classe .wm (logotipo oficial
ESTOKE / AO CUBO em vetor) copiada de posts-insta/posts.html. Uso: python3 posts-pacote/build.py"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DIR)
wm = next(l for l in open(os.path.join(ROOT, "posts-insta", "posts.html"), encoding="utf-8") if l.lstrip().startswith(".wm {"))
css = open(os.path.join(DIR, "base.src.css"), encoding="utf-8").read().replace("/*WM*/", wm.strip())
open(os.path.join(DIR, "base.css"), "w", encoding="utf-8").write(css)
print("posts-pacote/base.css")
