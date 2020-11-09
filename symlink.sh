#!/bin/bash

# Ask the user which app they want to Symlink with
echo Which application would you like to create a symlink for?
options=("musora" "drumeo" "pianote" "guitareo")
select opt in "${options[@]}"
do
    case $opt in
        "musora")
            echo "Symlinking with Musora!"
            npm install; npm link; cd /app/musora/frontend; npm link @musora/helper-functions; npm run watch;
            echo "Watching Musora For Changes..."
            ;;
        "drumeo")
            echo "Symlinking with Drumeo!"
            npm install; npm link; cd /app/drumeo/laravel; npm link @musora/helper-functions; npm run watch;
            echo "Watching Drumeo For Changes..."
            ;;
        "pianote")
            echo "Symlinking with Pianote!"
            npm install; npm link; cd /app/pianote; npm link @musora/helper-functions; npm run watch;
            echo "Watching Pianote For Changes..."
            ;;
        "guitareo")
            echo "Symlinking with Guitareo!"
            npm install; npm link; cd /app/guitareo; npm link @musora/helper-functions; npm run watch;
            ;;
        *)
          echo "Invalid option $REPLY"
          break
          ;;
    esac
done

