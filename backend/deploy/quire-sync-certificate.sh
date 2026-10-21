#!/bin/sh
set -eu

source_dir=/var/lib/radius/letsencrypt/live/2.58.172.162
target_dir=/var/lib/quire/tls
test -s "$source_dir/fullchain.pem"
test -s "$source_dir/privkey.pem"
install -d -o root -g quire -m 0750 "$target_dir"
install -o root -g quire -m 0640 "$source_dir/fullchain.pem" "$target_dir/fullchain.pem.new"
install -o root -g quire -m 0640 "$source_dir/privkey.pem" "$target_dir/privkey.pem.new"
mv -f "$target_dir/fullchain.pem.new" "$target_dir/fullchain.pem"
mv -f "$target_dir/privkey.pem.new" "$target_dir/privkey.pem"
